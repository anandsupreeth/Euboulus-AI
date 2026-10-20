import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve backend/.env regardless of the shell's current working directory.
BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    """Application settings read from environment variables / backend/.env."""

    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "ai_interview_prep")
    mongodb_collection_interviews: str = os.getenv(
        "MONGODB_COLLECTION_INTERVIEWS", "interviews"
    )
    mongodb_collection_users: str = os.getenv("MONGODB_COLLECTION_USERS", "users")
    mongodb_collection_refresh_sessions: str = os.getenv(
        "MONGODB_COLLECTION_REFRESH_SESSIONS", "refresh_sessions"
    )
    mongodb_collection_voice_sessions: str = os.getenv(
        "MONGODB_COLLECTION_VOICE_SESSIONS", "voice_sessions"
    )
    mongodb_collection_subjects: str = os.getenv("MONGODB_COLLECTION_SUBJECTS", "subjects")
    mongodb_collection_topics: str = os.getenv("MONGODB_COLLECTION_TOPICS", "topics")
    mongodb_collection_attempts: str = os.getenv(
        "MONGODB_COLLECTION_ATTEMPTS", "question_attempts"
    )
    mongodb_collection_topic_summaries: str = os.getenv(
        "MONGODB_COLLECTION_TOPIC_SUMMARIES", "topic_summaries"
    )
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    # Cheapest OpenAI model that takes audio in and returns audio out.
    openai_voice_model: str = os.getenv("OPENAI_VOICE_MODEL", "gpt-audio-mini")
    openai_voice: str = os.getenv("OPENAI_VOICE", "alloy")
    openai_transcribe_model: str = os.getenv(
        "OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe"
    )
    openai_text_model: str = os.getenv("OPENAI_TEXT_MODEL", "gpt-4o-mini")
    audio_storage_dir: Path = Path(
        os.getenv("AUDIO_STORAGE_DIR", str(BACKEND_DIR / "storage" / "audio"))
    )
    auth_secret_key: str = os.getenv("AUTH_SECRET_KEY", "")
    auth_access_token_minutes: int = int(os.getenv("AUTH_ACCESS_TOKEN_MINUTES", "10"))
    auth_refresh_token_days: int = int(os.getenv("AUTH_REFRESH_TOKEN_DAYS", "30"))
    auth_cookie_secure: bool = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
    auth_allowed_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "AUTH_ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    )


settings = Settings()
