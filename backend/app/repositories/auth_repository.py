from datetime import datetime
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError


class AuthRepository:
    """MongoDB operations for accounts and revocable refresh sessions."""

    def __init__(self, users: Any, sessions: Any) -> None:
        self.users = users
        self.sessions = sessions

    async def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        return await self.users.find_one({"email": email})

    async def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        if not ObjectId.is_valid(user_id):
            return None
        return await self.users.find_one({"_id": ObjectId(user_id)})

    async def update_full_name(self, user_id: str, full_name: str) -> dict[str, Any] | None:
        if not ObjectId.is_valid(user_id):
            return None
        return await self.users.find_one_and_update(
            {"_id": ObjectId(user_id)}, {"$set": {"full_name": full_name}}, return_document=True
        )

    async def create_user(self, full_name: str, email: str, password_hash: str) -> dict[str, Any] | None:
        try:
            result = await self.users.insert_one({
                "full_name": full_name,
                "email": email,
                "password_hash": password_hash,
            })
        except DuplicateKeyError:
            return None
        return await self.users.find_one({"_id": result.inserted_id})

    async def create_refresh_session(
        self, token_hash: str, family_id: str, user_id: str, expires_at: datetime
    ) -> None:
        await self.sessions.insert_one({
            "token_hash": token_hash,
            "family_id": family_id,
            "user_id": user_id,
            "expires_at": expires_at,
            "revoked": False,
        })

    async def consume_refresh_session(
        self, token_hash: str, now: datetime
    ) -> dict[str, Any] | None:
        return await self.sessions.find_one_and_update(
            {"token_hash": token_hash, "revoked": False, "expires_at": {"$gt": now}},
            {"$set": {"revoked": True, "revoked_at": now}},
            return_document=True,
        )

    async def get_refresh_session(self, token_hash: str) -> dict[str, Any] | None:
        return await self.sessions.find_one({"token_hash": token_hash})

    async def revoke_family(self, family_id: str, now: datetime) -> None:
        await self.sessions.update_many(
            {"family_id": family_id, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": now}},
        )

    async def revoke_refresh_token(self, token_hash: str, now: datetime) -> None:
        await self.sessions.update_one(
            {"token_hash": token_hash, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": now}},
        )