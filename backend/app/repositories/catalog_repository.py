from typing import Any

from pymongo import ASCENDING, UpdateOne

from app.catalog.data import SUBJECTS


class CatalogRepository:
    """Read access to `subjects` and `topics`, plus the idempotent startup seed."""

    def __init__(self, subjects: Any, topics: Any) -> None:
        self.subjects = subjects
        self.topics = topics

    async def ensure_indexes(self) -> None:
        await self.subjects.create_index("slug", unique=True)
        await self.topics.create_index([("subject_slug", ASCENDING), ("slug", ASCENDING)], unique=True)

    async def seed(self) -> None:
        """Upsert the catalog by slug; safe to run on every start."""
        subject_ops: list[UpdateOne] = []
        topic_ops: list[UpdateOne] = []
        for subject_order, (slug, name, category, description, topics) in enumerate(SUBJECTS):
            subject_ops.append(
                UpdateOne(
                    {"slug": slug},
                    {"$set": {"name": name, "category": category, "description": description,
                              "order": subject_order, "active": True}},
                    upsert=True,
                )
            )
            for topic_order, (topic_slug, topic_name) in enumerate(topics):
                topic_ops.append(
                    UpdateOne(
                        {"subject_slug": slug, "slug": topic_slug},
                        {"$set": {"name": topic_name, "order": topic_order, "active": True}},
                        upsert=True,
                    )
                )
        await self.subjects.bulk_write(subject_ops, ordered=False)
        await self.topics.bulk_write(topic_ops, ordered=False)

    async def list_subjects(self) -> list[dict[str, Any]]:
        cursor = self.subjects.find({"active": True}).sort("order", ASCENDING)
        return [doc async for doc in cursor]

    async def get_subject(self, slug: str) -> dict[str, Any] | None:
        return await self.subjects.find_one({"slug": slug, "active": True})

    async def list_topics(self, subject_slug: str) -> list[dict[str, Any]]:
        cursor = self.topics.find({"subject_slug": subject_slug, "active": True}).sort("order", ASCENDING)
        return [doc async for doc in cursor]

    async def get_topic(self, subject_slug: str, topic_slug: str) -> dict[str, Any] | None:
        return await self.topics.find_one(
            {"subject_slug": subject_slug, "slug": topic_slug, "active": True}
        )

    async def topic_counts(self) -> dict[str, int]:
        cursor = await self.topics.aggregate(
            [{"$match": {"active": True}}, {"$group": {"_id": "$subject_slug", "count": {"$sum": 1}}}]
        )
        return {doc["_id"]: doc["count"] async for doc in cursor}
