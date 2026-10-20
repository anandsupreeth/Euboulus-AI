from datetime import datetime, timezone

from app.schemas.interview import (
    DashboardSummary,
    InterviewCreate,
    InterviewFeedback,
    InterviewRecord,
)
from app.repositories.interview_repository import InterviewRepository

def _make_demo_feedback(transcript: str) -> InterviewFeedback:
    """Return placeholder scores until a real AI feedback provider is connected."""
    word_count = len(transcript.split())
    return InterviewFeedback(
        technical_score=min(90, 40 + word_count // 3),
        communication_score=min(90, 45 + word_count // 4),
        confidence_score=min(90, 45 + word_count // 5),
        strengths=["You completed a practice response."],
        improvements=["Explain your reasoning and trade-offs in more detail."],
        is_demo=True,
    )


async def create_interview(
    payload: InterviewCreate, repository: InterviewRepository
) -> InterviewRecord:
    record = InterviewRecord(
        id="",
        created_at=datetime.now(timezone.utc),
        topic=payload.topic,
        difficulty=payload.difficulty,
        transcript=payload.transcript,
        duration_seconds=payload.duration_seconds,
        feedback=_make_demo_feedback(payload.transcript),
    )
    return await repository.create(record)


async def list_interviews(repository: InterviewRepository) -> list[InterviewRecord]:
    return await repository.list_recent()


async def get_interview(
    interview_id: str, repository: InterviewRepository
) -> InterviewRecord | None:
    return await repository.get_by_id(interview_id)


async def get_dashboard_summary(repository: InterviewRepository) -> DashboardSummary:
    count = await repository.count()
    confidence = await repository.average_confidence()
    return DashboardSummary(
        interview_count=count,
        confidence_score=confidence,
        daily_streak=0,
        recent_interviews=await repository.list_recent(limit=5),
        weak_topics=[],
        recommended_topics=["DSA", "System Design"],
    )
