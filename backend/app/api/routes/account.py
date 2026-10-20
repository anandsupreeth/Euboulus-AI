from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import current_user_id, database
from app.core.config import settings
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import ProfileUpdate, PublicUser

router = APIRouter(prefix="/account", tags=["account"])


@router.patch("/profile", response_model=PublicUser)
async def update_profile(
    payload: ProfileUpdate, request: Request, user_id: str = Depends(current_user_id)
) -> PublicUser:
    """Change the signed-in user's display name. Email and password are not editable here."""
    db = database(request)
    repository = AuthRepository(
        db[settings.mongodb_collection_users], db[settings.mongodb_collection_refresh_sessions]
    )
    user = await repository.update_full_name(user_id, payload.full_name)
    if user is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return PublicUser(id=str(user["_id"]), full_name=user["full_name"], email=user["email"])
