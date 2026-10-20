from typing import Any

from bson import ObjectId
from pymongo import DESCENDING

from app.schemas.voice import VoiceSession


def _to_session(document: dict[str, Any]) -> VoiceSession:
    document["id"] = str(document.pop("_id"))
    return VoiceSession.model_validate(document)


class VoiceSessionRepository:
    """MongoDB access for voice interview sessions (turns are embedded).

    Every read is scoped by user_id so one account can never load another's session.
    """

    def __init__(self, collection: Any) -> None:
        self.collection = collection

    async def ensure_indexes(self) -> None:
        await self.collection.create_index([("user_id", 1), ("created_at", DESCENDING)])

    async def create(self, session: VoiceSession) -> VoiceSession:
        result = await self.collection.insert_one(session.model_dump(exclude={"id"}))
        return session.model_copy(update={"id": str(result.inserted_id)})

    async def save(self, session: VoiceSession) -> None:
        await self.collection.replace_one(
            {"_id": ObjectId(session.id), "user_id": session.user_id},
            session.model_dump(exclude={"id"}),
        )

    async def delete(self, session_id: str, user_id: str) -> None:
        await self.collection.delete_one({"_id": ObjectId(session_id), "user_id": user_id})

    async def delete_for_subject(self, user_id: str, subject_slug: str) -> list[str]:
        """Delete a user's sessions for one subject and return their ids (to clean up audio)."""
        query = {"user_id": user_id, "subject_slug": subject_slug}
        ids = [str(d["_id"]) async for d in self.collection.find(query, {"_id": 1})]
        await self.collection.delete_many(query)
        return ids

    async def get(self, session_id: str, user_id: str) -> VoiceSession | None:
        if not ObjectId.is_valid(session_id):
            return None
        document = await self.collection.find_one({"_id": ObjectId(session_id), "user_id": user_id})
        return _to_session(document) if document else None

    async def list_recent(self, user_id: str, limit: int = 50) -> list[VoiceSession]:
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        return [_to_session(document) async for document in cursor]
