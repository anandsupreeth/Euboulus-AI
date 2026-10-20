from datetime import datetime

from pydantic import BaseModel

from app.schemas.voice import Difficulty


class Progress(BaseModel):
    attempts: int = 0  # answered questions
    average_score: int | None = None
    best_score: int | None = None
    last_practiced: datetime | None = None


class TopicOut(Progress):
    slug: str
    name: str


class SubjectOut(Progress):
    slug: str
    name: str
    category: str
    description: str
    topic_count: int


class SubjectDetail(SubjectOut):
    topics: list[TopicOut]


class CategoryOut(BaseModel):
    category: str
    subjects: list[SubjectOut]


class CatalogOverview(BaseModel):
    total_attempts: int
    average_score: int | None
    categories: list[CategoryOut]


class AttemptOut(BaseModel):
    id: str
    session_id: str
    created_at: datetime
    difficulty: Difficulty
    question_text: str
    answer_text: str
    question_audio: str | None
    answer_audio: str | None
    score: int
    summary: str
    strengths: list[str]
    improvements: list[str]


class TopicSummaryOut(BaseModel):
    attempt_count: int
    average_score: int | None
    summary: str
    top_improvements: list[str]
    generated_at: datetime | None = None
