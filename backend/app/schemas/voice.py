from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

Difficulty = Literal["Easy", "Medium", "Hard"]


class TopicSuggestion(BaseModel):
    topic: str
    subtopic: str


class VoiceSessionCreate(BaseModel):
    """Either a catalog topic (subject_slug + topic_slug) or a free-text topic + subtopic."""

    subject_slug: str | None = Field(default=None, max_length=80)
    topic_slug: str | None = Field(default=None, max_length=80)
    topic: str | None = Field(default=None, max_length=80)
    subtopic: str | None = Field(default=None, max_length=120)
    difficulty: Difficulty = "Medium"

    @model_validator(mode="after")
    def check_target(self) -> "VoiceSessionCreate":
        has_catalog = bool(self.subject_slug and self.topic_slug)
        has_custom = bool(self.topic and self.topic.strip() and self.subtopic and self.subtopic.strip())
        if not has_catalog and not has_custom:
            raise ValueError("Provide subject_slug and topic_slug, or topic and subtopic")
        return self


class AnswerEvaluation(BaseModel):
    score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    improvements: list[str]


class VoiceTurn(BaseModel):
    index: int
    question_text: str
    # File names inside the session's audio folder, served by the audio route.
    question_audio: str | None = None
    answer_text: str = ""
    answer_audio: str | None = None
    answer_duration_seconds: int = 0
    evaluation: AnswerEvaluation | None = None


class VoiceFeedback(BaseModel):
    summary: str
    strengths: list[str]
    improvements: list[str]
    overall_score: int = Field(ge=0, le=100)


class VoiceSession(BaseModel):
    id: str = ""
    user_id: str = ""
    created_at: datetime
    topic: str
    subtopic: str
    # Set when the session was started from the catalog; None for free-text topics.
    subject_slug: str | None = None
    topic_slug: str | None = None
    difficulty: Difficulty
    status: Literal["active", "completed"] = "active"
    turns: list[VoiceTurn] = []
    feedback: VoiceFeedback | None = None
    closing_audio: str | None = None
