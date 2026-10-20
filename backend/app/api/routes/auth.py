from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status

from app.core.config import settings
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import (
    _token_hash,
    login,
    refresh,
    register,
    validate_auth_configuration,
)

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "refresh_token"


def _repository(request: Request) -> AuthRepository:
    database = request.app.state.mongo_database
    return AuthRepository(
        database[settings.mongodb_collection_users],
        database[settings.mongodb_collection_refresh_sessions],
    )


def _validate_request(request: Request) -> None:
    if request.headers.get("origin") not in settings.auth_allowed_origins:
        raise HTTPException(status_code=403, detail="Request origin is not allowed")
    try:
        validate_auth_configuration()
    except RuntimeError as error:
        raise HTTPException(
            status_code=503, detail="Authentication is not configured on this server"
        ) from error


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        token,
        max_age=settings.auth_refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="strict",
        path="/api/auth",
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_account(
    payload: RegisterRequest, request: Request, response: Response
) -> AuthResponse:
    _validate_request(request)
    result = await register(
        _repository(request), payload.full_name, payload.email, payload.password
    )
    if result is None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    auth_response, refresh_token = result
    _set_refresh_cookie(response, refresh_token)
    return auth_response


@router.post("/login", response_model=AuthResponse)
async def login_account(
    payload: LoginRequest, request: Request, response: Response
) -> AuthResponse:
    _validate_request(request)
    result = await login(_repository(request), payload.email, payload.password)
    if result is None:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    auth_response, refresh_token = result
    _set_refresh_cookie(response, refresh_token)
    return auth_response


@router.post("/refresh", response_model=AuthResponse)
async def refresh_session(request: Request, response: Response) -> AuthResponse:
    _validate_request(request)
    result = await refresh(
        _repository(request), request.cookies.get(REFRESH_COOKIE)
    )
    if result is None:
        response.delete_cookie(REFRESH_COOKIE, path="/api/auth", samesite="strict")
        raise HTTPException(status_code=401, detail="Session expired; please sign in again")
    auth_response, refresh_token = result
    _set_refresh_cookie(response, refresh_token)
    return auth_response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    _validate_request(request)
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        await _repository(request).revoke_refresh_token(
            _token_hash(token), datetime.now(timezone.utc)
        )
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth", samesite="strict")