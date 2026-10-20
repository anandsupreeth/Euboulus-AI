from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import AuthResponse, PublicUser

password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-account-password")


def validate_auth_configuration() -> None:
    if len(settings.auth_secret_key) < 32:
        raise RuntimeError("AUTH_SECRET_KEY must contain at least 32 characters")


def _public_user(user: dict[str, Any]) -> PublicUser:
    return PublicUser(
        id=str(user["_id"]), full_name=user["full_name"], email=user["email"]
    )


def _access_token(user_id: str) -> tuple[str, int]:
    validate_auth_configuration()
    now = datetime.now(timezone.utc)
    expires_in = settings.auth_access_token_minutes * 60
    token = jwt.encode(
        {"sub": user_id, "iat": now, "exp": now + timedelta(seconds=expires_in), "type": "access"},
        settings.auth_secret_key,
        algorithm="HS256",
    )
    return token, expires_in


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def issue_auth_response(repository: AuthRepository, user: dict[str, Any]) -> tuple[AuthResponse, str]:
    token, expires_in = _access_token(str(user["_id"]))
    refresh_token = secrets.token_urlsafe(48)
    await repository.create_refresh_session(
        _token_hash(refresh_token),
        str(uuid.uuid4()),
        str(user["_id"]),
        datetime.now(timezone.utc) + timedelta(days=settings.auth_refresh_token_days),
    )
    return AuthResponse(
        access_token=token, expires_in=expires_in, user=_public_user(user)
    ), refresh_token


async def register(
    repository: AuthRepository, full_name: str, email: str, password: str
) -> tuple[AuthResponse, str] | None:
    validate_auth_configuration()
    user = await repository.create_user(full_name, email, password_hasher.hash(password))
    if user is None:
        return None
    return await issue_auth_response(repository, user)


async def login(
    repository: AuthRepository, email: str, password: str
) -> tuple[AuthResponse, str] | None:
    validate_auth_configuration()
    user = await repository.get_user_by_email(email)
    if user is None:
        password_hasher.verify(password, DUMMY_PASSWORD_HASH)
        return None
    if not password_hasher.verify(password, user["password_hash"]):
        return None
    return await issue_auth_response(repository, user)


async def refresh(
    repository: AuthRepository, refresh_token: str | None
) -> tuple[AuthResponse, str] | None:
    validate_auth_configuration()
    if not refresh_token:
        return None
    now = datetime.now(timezone.utc)
    token_hash = _token_hash(refresh_token)
    session = await repository.consume_refresh_session(token_hash, now)
    if session is None:
        previous_session = await repository.get_refresh_session(token_hash)
        if previous_session is not None and previous_session["revoked"]:
            await repository.revoke_family(previous_session["family_id"], now)
        return None
    user = await repository.get_user_by_id(session["user_id"])
    if user is None:
        return None
    token, expires_in = _access_token(str(user["_id"]))
    next_refresh_token = secrets.token_urlsafe(48)
    await repository.create_refresh_session(
        _token_hash(next_refresh_token),
        session["family_id"],
        session["user_id"],
        now + timedelta(days=settings.auth_refresh_token_days),
    )
    return AuthResponse(
        access_token=token, expires_in=expires_in, user=_public_user(user)
    ), next_refresh_token