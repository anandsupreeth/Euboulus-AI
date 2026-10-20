from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from pymongo import AsyncMongoClient

from app.core.config import settings
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.voice_repository import VoiceSessionRepository


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Connect once at startup and close MongoDB cleanly at shutdown."""
    client = AsyncMongoClient(
        settings.mongodb_uri, serverSelectionTimeoutMS=5000, tz_aware=True
    )
    try:
        # Force a connection attempt now so misconfiguration fails at startup.
        await client.admin.command("ping")
        app.state.mongo_client = client
        app.state.mongo_database = client[settings.mongodb_database]
        await app.state.mongo_database[settings.mongodb_collection_interviews].create_index(
            "created_at"
        )
        await app.state.mongo_database[settings.mongodb_collection_users].create_index(
            "email", unique=True
        )
        await app.state.mongo_database[settings.mongodb_collection_refresh_sessions].create_index(
            "token_hash", unique=True
        )
        await app.state.mongo_database[settings.mongodb_collection_refresh_sessions].create_index(
            "expires_at", expireAfterSeconds=0
        )
        database = app.state.mongo_database
        await VoiceSessionRepository(
            database[settings.mongodb_collection_voice_sessions]
        ).ensure_indexes()
        await AttemptRepository(
            database[settings.mongodb_collection_attempts],
            database[settings.mongodb_collection_topic_summaries],
        ).ensure_indexes()
        catalog = CatalogRepository(
            database[settings.mongodb_collection_subjects],
            database[settings.mongodb_collection_topics],
        )
        await catalog.ensure_indexes()
        await catalog.seed()
        yield
    finally:
        await client.close()
