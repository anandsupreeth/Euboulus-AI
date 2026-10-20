import base64
import json

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.voice import TopicSuggestion, VoiceFeedback, VoiceSession

FALLBACK_SUGGESTIONS = [
    TopicSuggestion(topic="Data Structures", subtopic="Linked lists and pointers"),
    TopicSuggestion(topic="System Design", subtopic="Designing a URL shortener"),
    TopicSuggestion(topic="Python", subtopic="Concurrency and asyncio"),
]


class AINotConfiguredError(RuntimeError):
    pass


def get_client() -> AsyncOpenAI:
    if not settings.openai_api_key:
        raise AINotConfiguredError("OPENAI_API_KEY is not set in backend/.env")
    return AsyncOpenAI(api_key=settings.openai_api_key)


def _system_prompt(session: VoiceSession) -> str:
    return (
        f"You are a friendly but rigorous spoken interviewer. Topic: {session.topic}. "
        f"Subtopic: {session.subtopic}. Difficulty: {session.difficulty}. "
        "Ask exactly ONE question at a time. After the candidate answers, react in one "
        "short sentence (acknowledge what was right, or gently correct a mistake), then "
        "ask the next question, going deeper or adjusting to how they did. "
        "Everything you say is spoken aloud: keep it under 60 words, no lists, no markdown."
    )


def _history(session: VoiceSession) -> list[dict]:
    """Prior turns as text. The turn awaiting an answer is included as a question only."""
    messages: list[dict] = [{"role": "user", "content": "Please begin the interview."}]
    for turn in session.turns:
        messages.append({"role": "assistant", "content": turn.question_text})
        if turn.answer_text:
            messages.append({"role": "user", "content": turn.answer_text})
    return messages


async def _speak(client: AsyncOpenAI, messages: list[dict]) -> tuple[str, bytes]:
    """Call the voice-to-voice model; returns (spoken text, mp3 bytes)."""
    completion = await client.chat.completions.create(
        model=settings.openai_voice_model,
        modalities=["text", "audio"],
        audio={"voice": settings.openai_voice, "format": "mp3"},
        messages=messages,
    )
    audio = completion.choices[0].message.audio
    if audio is None:
        raise RuntimeError("The voice model returned no audio")
    return audio.transcript or "", base64.b64decode(audio.data)


async def ask_next_question(
    client: AsyncOpenAI, session: VoiceSession, answer_wav: bytes | None
) -> tuple[str, bytes]:
    """Opening question (answer_wav=None) or reaction + follow-up to a spoken answer."""
    messages = [{"role": "system", "content": _system_prompt(session)}, *_history(session)]
    if answer_wav is not None:
        # The newest answer goes in as audio so the model hears it directly; its text
        # transcript is only saved for later turns and for the review screen.
        messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": base64.b64encode(answer_wav).decode(),
                            "format": "wav",
                        },
                    }
                ],
            }
        )
    return await _speak(client, messages)


async def transcribe(client: AsyncOpenAI, wav: bytes) -> str:
    result = await client.audio.transcriptions.create(
        model=settings.openai_transcribe_model, file=("answer.wav", wav, "audio/wav")
    )
    return result.text.strip()


def _transcript_text(session: VoiceSession) -> str:
    return "\n".join(
        f"Q{t.index + 1}: {t.question_text}\nA{t.index + 1}: {t.answer_text or '(no answer)'}"
        for t in session.turns
    )


async def closing_remarks(client: AsyncOpenAI, session: VoiceSession) -> tuple[str, bytes]:
    return await _speak(
        client,
        [
            {
                "role": "system",
                "content": _system_prompt(session)
                + " The interview is over: thank the candidate and give a two-sentence "
                "spoken summary of how they did. Do not ask another question.",
            },
            {"role": "user", "content": _transcript_text(session)},
        ],
    )


async def write_feedback(client: AsyncOpenAI, session: VoiceSession) -> VoiceFeedback:
    completion = await client.chat.completions.create(
        model=settings.openai_text_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You grade a mock interview. Reply with JSON: "
                    '{"summary": str, "strengths": [str], "improvements": [str], '
                    '"overall_score": int 0-100}. Be specific and concise; 2-4 items per list. '
                    f"Topic: {session.topic} / {session.subtopic} ({session.difficulty})."
                ),
            },
            {"role": "user", "content": _transcript_text(session)},
        ],
    )
    data = json.loads(completion.choices[0].message.content or "{}")
    return VoiceFeedback(
        summary=str(data.get("summary", "")),
        strengths=[str(x) for x in data.get("strengths", [])],
        improvements=[str(x) for x in data.get("improvements", [])],
        overall_score=max(0, min(100, int(data.get("overall_score", 0)))),
    )


async def suggest_topics(client: AsyncOpenAI, hint: str = "") -> list[TopicSuggestion]:
    completion = await client.chat.completions.create(
        model=settings.openai_text_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Suggest 3 varied technical interview practice choices. Reply with JSON "
                    '{"suggestions": [{"topic": str, "subtopic": str}]}. Topic is broad '
                    "(max 3 words), subtopic is specific (max 6 words)."
                ),
            },
            {"role": "user", "content": hint or "Any software engineering interview."},
        ],
    )
    data = json.loads(completion.choices[0].message.content or "{}")
    items = [TopicSuggestion.model_validate(x) for x in data.get("suggestions", [])]
    return items[:3] or FALLBACK_SUGGESTIONS
