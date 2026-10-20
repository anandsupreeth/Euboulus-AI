from fastapi import APIRouter, Request

from app.core.config import settings
from app.repositories.interview_repository import InterviewRepository
from app.schemas.interview import DashboardSummary
from app.services.interview_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummary)
async def read_dashboard(request: Request) -> DashboardSummary:
    """Return dashboard metrics calculated from MongoDB interview records."""
    collection = request.app.state.mongo_database[settings.mongodb_collection_interviews]
    return await get_dashboard_summary(InterviewRepository(collection))
