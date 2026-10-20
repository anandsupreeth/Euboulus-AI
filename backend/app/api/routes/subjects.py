from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from openai import OpenAIError

from app.api.deps import current_user_id, database
from app.core.config import settings
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.voice_repository import VoiceSessionRepository
from app.schemas.catalog import (
    AttemptOut,
    CatalogOverview,
    CategoryOut,
    Progress,
    SubjectDetail,
    SubjectOut,
    TopicOut,
    TopicSummaryOut,
)
from app.services import audio_store, voice_ai, voice_eval

router = APIRouter(prefix="/subjects", tags=["subjects"])

# Answers taken into account when summarising a topic; keeps the prompt small and recent.
SUMMARY_WINDOW = 15


def _catalog(request: Request) -> CatalogRepository:
    db = database(request)
    return CatalogRepository(
        db[settings.mongodb_collection_subjects], db[settings.mongodb_collection_topics]
    )


def _attempts(request: Request) -> AttemptRepository:
    db = database(request)
    return AttemptRepository(
        db[settings.mongodb_collection_attempts], db[settings.mongodb_collection_topic_summaries]
    )


def _subject_out(doc: dict, topic_count: int, progress: dict | None) -> SubjectOut:
    return SubjectOut(
        slug=doc["slug"],
        name=doc["name"],
        category=doc["category"],
        description=doc["description"],
        topic_count=topic_count,
        **Progress(**(progress or {})).model_dump(),
    )


async def _require_topic(request: Request, subject_slug: str, topic_slug: str) -> tuple[dict, dict]:
    catalog = _catalog(request)
    subject = await catalog.get_subject(subject_slug)
    topic = await catalog.get_topic(subject_slug, topic_slug)
    if subject is None or topic is None:
        raise HTTPException(status_code=404, detail="Subject or topic not found")
    return subject, topic


@router.get("", response_model=CatalogOverview)
async def overview(request: Request, user_id: str = Depends(current_user_id)) -> CatalogOverview:
    """All subjects grouped by category, with the signed-in user's progress on each."""
    catalog, attempts = _catalog(request), _attempts(request)
    subjects = await catalog.list_subjects()
    counts = await catalog.topic_counts()
    progress = await attempts.subject_progress(user_id)
    total, average = await attempts.overall(user_id)

    categories: dict[str, list[SubjectOut]] = {}
    for doc in subjects:
        categories.setdefault(doc["category"], []).append(
            _subject_out(doc, counts.get(doc["slug"], 0), progress.get(doc["slug"]))
        )
    return CatalogOverview(
        total_attempts=total,
        average_score=average,
        categories=[CategoryOut(category=name, subjects=items) for name, items in categories.items()],
    )


@router.get("/{subject_slug}", response_model=SubjectDetail)
async def subject_detail(
    subject_slug: str, request: Request, user_id: str = Depends(current_user_id)
) -> SubjectDetail:
    catalog, attempts = _catalog(request), _attempts(request)
    subject = await catalog.get_subject(subject_slug)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    topics = await catalog.list_topics(subject_slug)
    progress = await attempts.topic_progress(user_id, subject_slug)
    topic_rows = [
        TopicOut(slug=t["slug"], name=t["name"], **Progress(**progress.get(t["slug"], {})).model_dump())
        for t in topics
    ]
    answered = [t for t in topic_rows if t.attempts]
    total = sum(t.attempts for t in answered)
    average = round(sum((t.average_score or 0) * t.attempts for t in answered) / total) if total else None
    base = _subject_out(subject, len(topic_rows), None).model_dump()
    base.update(
        attempts=total,
        average_score=average,
        best_score=max((t.best_score or 0 for t in answered), default=None),
        last_practiced=max((t.last_practiced for t in answered if t.last_practiced), default=None),
    )
    return SubjectDetail(**base, topics=topic_rows)


@router.delete("/{subject_slug}/progress")
async def reset_subject_progress(
    subject_slug: str, request: Request, user_id: str = Depends(current_user_id)
) -> dict[str, int]:
    """Start a module from scratch: erase this user's answers, summaries and voice sessions for it."""
    if await _catalog(request).get_subject(subject_slug) is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    answers = await _attempts(request).delete_subject(user_id, subject_slug)
    sessions = VoiceSessionRepository(database(request)[settings.mongodb_collection_voice_sessions])
    session_ids = await sessions.delete_for_subject(user_id, subject_slug)
    for session_id in session_ids:
        audio_store.delete_session_audio(session_id)
    return {"answers_deleted": answers, "sessions_deleted": len(session_ids)}


@router.get("/{subject_slug}/topics/{topic_slug}/attempts", response_model=list[AttemptOut])
async def topic_attempts(
    subject_slug: str,
    topic_slug: str,
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user_id: str = Depends(current_user_id),
) -> list[AttemptOut]:
    """Questions the user has answered in this topic, newest first, with score and feedback."""
    await _require_topic(request, subject_slug, topic_slug)
    return await _attempts(request).list_for_topic(user_id, subject_slug, topic_slug, limit, skip)


@router.get("/{subject_slug}/topics/{topic_slug}/summary", response_model=TopicSummaryOut)
async def topic_summary(
    subject_slug: str,
    topic_slug: str,
    request: Request,
    user_id: str = Depends(current_user_id),
) -> TopicSummaryOut:
    """Improvement-points summary for a topic; regenerated only when new answers exist."""
    subject, topic = await _require_topic(request, subject_slug, topic_slug)
    attempts = _attempts(request)
    progress = (await attempts.topic_progress(user_id, subject_slug)).get(topic_slug)
    if not progress:
        return TopicSummaryOut(attempt_count=0, average_score=None, summary="", top_improvements=[])

    cached = await attempts.get_summary(user_id, subject_slug, topic_slug)
    if cached and cached.get("attempt_count") == progress["attempts"]:
        return TopicSummaryOut(**{k: cached[k] for k in TopicSummaryOut.model_fields if k in cached})

    recent = await attempts.recent_for_topic(user_id, subject_slug, topic_slug, SUMMARY_WINDOW)
    try:
        summary, improvements = await voice_eval.summarize_topic(
            voice_ai.get_client(), subject["name"], topic["name"], recent
        )
    except (voice_ai.AINotConfiguredError, OpenAIError, ValueError):
        # Fall back to the stored per-answer points rather than failing the page.
        seen: dict[str, None] = {}
        for item in recent:
            for point in item.get("improvements", []):
                seen.setdefault(point, None)
        summary, improvements = "", list(seen)[:5]

    data = {
        "attempt_count": progress["attempts"],
        "average_score": progress["average_score"],
        "summary": summary,
        "top_improvements": improvements,
        "generated_at": datetime.now(timezone.utc),
    }
    if summary:  # don't cache the fallback, so the next visit retries the AI summary
        await attempts.save_summary(user_id, subject_slug, topic_slug, data)
    return TopicSummaryOut(**data)
