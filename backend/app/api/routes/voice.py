from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from openai import OpenAIError

from app.api.deps import current_user_id, database
from app.core.config import settings
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.voice_repository import VoiceSessionRepository
from app.schemas.voice import TopicSuggestion, VoiceSession, VoiceSessionCreate
from app.services import voice_ai
from app.services.audio_store import audio_path
from app.services.voice_graph import run_step

router = APIRouter(prefix="/voice", tags=["voice"])

MAX_ANSWER_BYTES = 15 * 1024 * 1024


def _repo(request: Request) -> VoiceSessionRepository:
    return VoiceSessionRepository(database(request)[settings.mongodb_collection_voice_sessions])


def _attempts(request: Request) -> AttemptRepository:
    db = database(request)
    return AttemptRepository(
        db[settings.mongodb_collection_attempts], db[settings.mongodb_collection_topic_summaries]
    )


def _catalog(request: Request) -> CatalogRepository:
    db = database(request)
    return CatalogRepository(
        db[settings.mongodb_collection_subjects], db[settings.mongodb_collection_topics]
    )


def _client():
    try:
        return voice_ai.get_client()
    except voice_ai.AINotConfiguredError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


async def _load(request: Request, session_id: str, user_id: str) -> VoiceSession:
    session = await _repo(request).get(session_id, user_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _ai_error(error: OpenAIError) -> HTTPException:
    return HTTPException(status_code=502, detail=f"OpenAI request failed: {error}")


@router.get("/suggestions", response_model=list[TopicSuggestion])
async def suggestions(hint: str = "", _: str = Depends(current_user_id)) -> list[TopicSuggestion]:
    """2-3 starting topic/subtopic ideas; falls back to a fixed list without an API key."""
    if not settings.openai_api_key:
        return voice_ai.FALLBACK_SUGGESTIONS
    try:
        return await voice_ai.suggest_topics(voice_ai.get_client(), hint[:200])
    except (OpenAIError, ValueError):
        return voice_ai.FALLBACK_SUGGESTIONS


@router.get("/sessions", response_model=list[VoiceSession])
async def list_sessions(request: Request, user_id: str = Depends(current_user_id)) -> list[VoiceSession]:
    return await _repo(request).list_recent(user_id)


@router.get("/sessions/{session_id}", response_model=VoiceSession)
async def read_session(
    session_id: str, request: Request, user_id: str = Depends(current_user_id)
) -> VoiceSession:
    return await _load(request, session_id, user_id)


@router.post("/sessions", response_model=VoiceSession, status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: VoiceSessionCreate, request: Request, user_id: str = Depends(current_user_id)
) -> VoiceSession:
    """Create a session and have the interviewer ask the opening question."""
    client = _client()
    subject_slug = topic_slug = None
    if payload.subject_slug and payload.topic_slug:
        catalog = _catalog(request)
        subject = await catalog.get_subject(payload.subject_slug)
        topic = await catalog.get_topic(payload.subject_slug, payload.topic_slug)
        if subject is None or topic is None:
            raise HTTPException(status_code=404, detail="Unknown subject or topic")
        subject_slug, topic_slug = subject["slug"], topic["slug"]
        topic_name, subtopic_name = subject["name"], topic["name"]
    else:
        topic_name, subtopic_name = (payload.topic or "").strip(), (payload.subtopic or "").strip()

    repo = _repo(request)
    session = await repo.create(
        VoiceSession(
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
            topic=topic_name,
            subtopic=subtopic_name,
            subject_slug=subject_slug,
            topic_slug=topic_slug,
            difficulty=payload.difficulty,
        )
    )
    try:
        return await run_step({"action": "start", "session": session}, client=client, repo=repo)
    except OpenAIError as error:
        await repo.delete(session.id, user_id)
        raise _ai_error(error) from error


@router.post("/sessions/{session_id}/answer", response_model=VoiceSession)
async def submit_answer(
    session_id: str,
    request: Request,
    audio: UploadFile = File(..., description="16-bit PCM WAV recording"),
    duration_seconds: int = Form(0, ge=0, le=3600),
    user_id: str = Depends(current_user_id),
) -> VoiceSession:
    """Send a spoken answer; returns the session with the answer scored and the next question."""
    session = await _load(request, session_id, user_id)
    if session.status != "active":
        raise HTTPException(status_code=409, detail="This interview is already finished")
    wav = await audio.read(MAX_ANSWER_BYTES + 1)
    if not wav:
        raise HTTPException(status_code=400, detail="Empty recording")
    if len(wav) > MAX_ANSWER_BYTES:
        raise HTTPException(status_code=413, detail="Recording is too long")
    try:
        return await run_step(
            {
                "action": "answer",
                "session": session,
                "answer_wav": wav,
                "answer_duration": duration_seconds,
            },
            client=_client(),
            repo=_repo(request),
            attempts=_attempts(request),
        )
    except OpenAIError as error:
        raise _ai_error(error) from error


@router.post("/sessions/{session_id}/finish", response_model=VoiceSession)
async def finish_session(
    session_id: str, request: Request, user_id: str = Depends(current_user_id)
) -> VoiceSession:
    """End the interview: spoken wrap-up plus written feedback."""
    session = await _load(request, session_id, user_id)
    if session.status == "completed":
        return session
    try:
        return await run_step(
            {"action": "finish", "session": session}, client=_client(), repo=_repo(request)
        )
    except OpenAIError as error:
        raise _ai_error(error) from error


@router.get("/sessions/{session_id}/audio/{name}")
async def read_audio(
    session_id: str, name: str, request: Request, user_id: str = Depends(current_user_id)
) -> FileResponse:
    await _load(request, session_id, user_id)  # ownership check before touching the disk
    path = audio_path(session_id, name)
    if path is None:
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(
        path,
        media_type="audio/mpeg" if name.endswith(".mp3") else "audio/wav",
        headers={"Cache-Control": "private, max-age=3600"},
    )
