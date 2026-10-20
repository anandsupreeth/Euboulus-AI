"""Scoring and coaching text generated from a candidate's answers."""
import json

from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.voice import AnswerEvaluation, VoiceSession


def _clean_list(value: object, limit: int = 5) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()][:limit]


async def evaluate_answer(
    client: AsyncOpenAI, session: VoiceSession, question: str, answer: str
) -> AnswerEvaluation:
    """Score one spoken answer (from its transcript) and say how to improve it."""
    if not answer.strip():
        return AnswerEvaluation(
            score=0,
            summary="No answer could be heard for this question.",
            strengths=[],
            improvements=["Answer out loud and make sure your microphone is picking you up."],
        )
    completion = await client.chat.completions.create(
        model=settings.openai_text_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a strict but fair interview evaluator. Score the candidate's spoken "
                    "answer from 0 to 100 on correctness, depth, structure and clarity. Reply with "
                    'JSON: {"score": int, "summary": str (one or two sentences), "strengths": [str], '
                    '"improvements": [str]}. Improvements must be specific and actionable (what to '
                    "add, fix or say differently), at most 4. The text is a speech transcript, so "
                    f"ignore transcription glitches. Topic: {session.topic} / {session.subtopic}. "
                    f"Difficulty: {session.difficulty}."
                ),
            },
            {"role": "user", "content": f"Question: {question}\n\nCandidate's answer: {answer}"},
        ],
    )
    data = json.loads(completion.choices[0].message.content or "{}")
    return AnswerEvaluation(
        score=max(0, min(100, int(data.get("score", 0)))),
        summary=str(data.get("summary", "")).strip(),
        strengths=_clean_list(data.get("strengths")),
        improvements=_clean_list(data.get("improvements"), 4),
    )


async def summarize_topic(
    client: AsyncOpenAI, subject_name: str, topic_name: str, attempts: list[dict]
) -> tuple[str, list[str]]:
    """Roll the recent answers for one topic into a short summary and top improvement points."""
    digest = "\n\n".join(
        f"Q: {a['question_text']}\nScore: {a['score']}\nImprovements noted: "
        + "; ".join(a.get("improvements", []))
        for a in attempts
    )
    completion = await client.chat.completions.create(
        model=settings.openai_text_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You coach a candidate preparing for interviews. From their recent evaluated "
                    'answers, reply with JSON: {"summary": str (2-3 sentences on how they are '
                    'doing and the main pattern), "top_improvements": [str]} where '
                    "top_improvements are the 3-5 most important, de-duplicated, actionable points "
                    f"to work on. Subject: {subject_name}. Topic: {topic_name}."
                ),
            },
            {"role": "user", "content": digest},
        ],
    )
    data = json.loads(completion.choices[0].message.content or "{}")
    return str(data.get("summary", "")).strip(), _clean_list(data.get("top_improvements"))
