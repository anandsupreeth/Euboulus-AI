from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


InterviewTopic = Literal[
    "DSA",
    "System Design",
    "Java",
    "React",
    "Python",
    "Behavioral",
]
Difficulty = Literal["Easy", "Medium", "Hard"]


class InterviewCreate(BaseModel):
    topic: InterviewTopic
    difficulty: Difficulty
    transcript: str = Field(default="", max_length=20_000)
    duration_seconds: int = Field(default=0, ge=0, le=7_200)


class InterviewFeedback(BaseModel):
    technical_score: int
    communication_score: int
    confidence_score: int
    strengths: list[str]
    improvements: list[str]
    is_demo: bool = True


class InterviewRecord(BaseModel):
    id: str
    created_at: datetime
    topic: InterviewTopic
    difficulty: Difficulty
    transcript: str
    duration_seconds: int
    feedback: InterviewFeedback


class DashboardSummary(BaseModel):
    interview_count: int
    confidence_score: int
    daily_streak: int
    recent_interviews: list[InterviewRecord]
    weak_topics: list[str]
    recommended_topics: list[str]
