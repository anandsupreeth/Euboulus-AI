from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.api.routes import account, auth, dashboard, interviews, subjects, voice
from app.core.config import settings
from app.db.mongo import lifespan

app = FastAPI(
    title="AI Interview Preparation API",
    description="Demo API for the AI Interview Preparation Platform frontend.",
    version="0.1.0",
    lifespan=lifespan,
)

# Vite's dev server proxies /api requests to this service. CORS also allows
# direct browser requests during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.auth_allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(account.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health_check(request: Request) -> dict[str, str]:
    try:
        await request.app.state.mongo_client.admin.command("ping")
    except PyMongoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not reachable",
        ) from error
    return {
        "status": "ok",
        "service": "ai-interview-api",
        "database": settings.mongodb_database,
    }
