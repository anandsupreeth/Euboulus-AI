from typing import Any

from pymongo import DESCENDING

from app.schemas.catalog import AttemptOut

_PROGRESS_GROUP = {
    "attempts": {"$sum": 1},
    "average": {"$avg": "$score"},
    "best": {"$max": "$score"},
    "last": {"$max": "$created_at"},
}


def _progress(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "attempts": doc["attempts"],
        "average_score": round(doc["average"]) if doc["average"] is not None else None,
        "best_score": doc["best"],
        "last_practiced": doc["last"],
    }


class AttemptRepository:
    """One document per answered question in `question_attempts`, always scoped to a user."""

    def __init__(self, attempts: Any, summaries: Any) -> None:
        self.attempts = attempts
        self.summaries = summaries

    async def ensure_indexes(self) -> None:
        # Serves "my answers for this topic, newest first" and the per-subject/topic roll-ups.
        await self.attempts.create_index(
            [("user_id", 1), ("subject_slug", 1), ("topic_slug", 1), ("created_at", DESCENDING)]
        )
        await self.attempts.create_index([("session_id", 1), ("turn_index", 1)], unique=True)
        await self.summaries.create_index(
            [("user_id", 1), ("subject_slug", 1), ("topic_slug", 1)], unique=True
        )

    async def insert(self, doc: dict[str, Any]) -> None:
        # Keyed by (session, turn) so a retried request can't double count an answer.
        await self.attempts.update_one(
            {"session_id": doc["session_id"], "turn_index": doc["turn_index"]},
            {"$setOnInsert": doc},
            upsert=True,
        )

    async def list_for_topic(
        self, user_id: str, subject_slug: str, topic_slug: str, limit: int = 50, skip: int = 0
    ) -> list[AttemptOut]:
        cursor = (
            self.attempts.find({"user_id": user_id, "subject_slug": subject_slug, "topic_slug": topic_slug})
            .sort("created_at", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        return [
            AttemptOut(id=str(d.pop("_id")), **{k: d[k] for k in AttemptOut.model_fields if k != "id"})
            async for d in cursor
        ]

    async def recent_for_topic(
        self, user_id: str, subject_slug: str, topic_slug: str, limit: int = 15
    ) -> list[dict[str, Any]]:
        cursor = (
            self.attempts.find({"user_id": user_id, "subject_slug": subject_slug, "topic_slug": topic_slug})
            .sort("created_at", DESCENDING)
            .limit(limit)
        )
        return [d async for d in cursor]

    async def subject_progress(self, user_id: str) -> dict[str, dict[str, Any]]:
        cursor = await self.attempts.aggregate(
            [{"$match": {"user_id": user_id}}, {"$group": {"_id": "$subject_slug", **_PROGRESS_GROUP}}]
        )
        return {d["_id"]: _progress(d) async for d in cursor}

    async def topic_progress(self, user_id: str, subject_slug: str) -> dict[str, dict[str, Any]]:
        cursor = await self.attempts.aggregate(
            [
                {"$match": {"user_id": user_id, "subject_slug": subject_slug}},
                {"$group": {"_id": "$topic_slug", **_PROGRESS_GROUP}},
            ]
        )
        return {d["_id"]: _progress(d) async for d in cursor}

    async def overall(self, user_id: str) -> tuple[int, int | None]:
        cursor = await self.attempts.aggregate(
            [{"$match": {"user_id": user_id}}, {"$group": {"_id": None, **_PROGRESS_GROUP}}]
        )
        docs = [d async for d in cursor]
        if not docs:
            return 0, None
        return docs[0]["attempts"], round(docs[0]["average"])

    async def delete_subject(self, user_id: str, subject_slug: str) -> int:
        """Remove a user's answers and cached summaries for one subject; returns answers deleted."""
        result = await self.attempts.delete_many({"user_id": user_id, "subject_slug": subject_slug})
        await self.summaries.delete_many({"user_id": user_id, "subject_slug": subject_slug})
        return result.deleted_count

    async def get_summary(self, user_id: str, subject_slug: str, topic_slug: str) -> dict[str, Any] | None:
        return await self.summaries.find_one(
            {"user_id": user_id, "subject_slug": subject_slug, "topic_slug": topic_slug}
        )

    async def save_summary(
        self, user_id: str, subject_slug: str, topic_slug: str, data: dict[str, Any]
    ) -> None:
        await self.summaries.update_one(
            {"user_id": user_id, "subject_slug": subject_slug, "topic_slug": topic_slug},
            {"$set": data},
            upsert=True,
        )
