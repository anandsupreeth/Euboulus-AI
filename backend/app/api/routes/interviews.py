from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.repositories.interview_repository import InterviewRepository
from app.schemas.interview import InterviewCreate, InterviewRecord
from app.services.interview_service import (
    create_interview,
    get_interview,
    list_interviews,
)

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=list[InterviewRecord])
async def read_interviews(request: Request) -> list[InterviewRecord]:
    """Return recent interviews saved in MongoDB."""
    collection = request.app.state.mongo_database[settings.mongodb_collection_interviews]
    return await list_interviews(InterviewRepository(collection))


@router.post("", response_model=InterviewRecord, status_code=status.HTTP_201_CREATED)
async def save_interview(payload: InterviewCreate, request: Request) -> InterviewRecord:
    """Save an interview and attach clearly-labeled demo feedback."""
    collection = request.app.state.mongo_database[settings.mongodb_collection_interviews]
    return await create_interview(payload, InterviewRepository(collection))


@router.get("/{interview_id}", response_model=InterviewRecord)
async def read_interview(interview_id: str, request: Request) -> InterviewRecord:
    collection = request.app.state.mongo_database[settings.mongodb_collection_interviews]
    interview = await get_interview(interview_id, InterviewRepository(collection))
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview
