import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer = HTTPBearer(auto_error=False)


async def current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """Verify the access JWT and return the user id it was issued to."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or len(settings.auth_secret_key) < 32:
        raise unauthorized
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.auth_secret_key,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as error:
        raise unauthorized from error
    if claims.get("type") != "access" or not isinstance(claims.get("sub"), str):
        raise unauthorized
    return claims["sub"]


def database(request: Request):
    return request.app.state.mongo_database
