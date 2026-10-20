from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.schemas.interview import InterviewRecord


def _to_record(document: dict[str, Any]) -> InterviewRecord:
    """Convert MongoDB's BSON document into the public API response schema."""
    document["id"] = str(document.pop("_id"))
    return InterviewRecord.model_validate(document)


class InterviewRepository:
    """Database access for interview documents; no HTTP concerns live here."""

    def __init__(self, collection: Any) -> None:
        self.collection = collection

    async def create(self, record: InterviewRecord) -> InterviewRecord:
        document = record.model_dump(exclude={"id"})
        document["created_at"] = record.created_at or datetime.now(timezone.utc)
        result = await self.collection.insert_one(document)
        saved = await self.collection.find_one({"_id": result.inserted_id})
        if saved is None:
            raise RuntimeError("MongoDB insert succeeded but record could not be read")
        return _to_record(saved)

    async def list_recent(self, limit: int = 100) -> list[InterviewRecord]:
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return [_to_record(document) async for document in cursor]

    async def get_by_id(self, interview_id: str) -> InterviewRecord | None:
        if not ObjectId.is_valid(interview_id):
            return None
        document = await self.collection.find_one({"_id": ObjectId(interview_id)})
        return _to_record(document) if document else None

    async def count(self) -> int:
        return await self.collection.count_documents({})

    async def average_confidence(self) -> int:
        pipeline = [
            {"$group": {"_id": None, "average": {"$avg": "$feedback.confidence_score"}}}
        ]
        cursor = await self.collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        return round(results[0]["average"]) if results and results[0]["average"] else 0
