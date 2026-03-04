"""
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="EduSense API",
    description=(
        "Backend for EduSense: a neuro-adaptive multisensory learning system. "
        "Uses behavioral proxies for cognitive load and engagement; supports haptic, audio, and visual "
        "content with theory-grounded adaptation (Cognitive Load, Dual Coding, Embodied Cognition). "
        "See RESEARCH_FRAMEWORK.md for theory mapping."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
# Ensure localhost:5173 and 127.0.0.1:5173 are both allowed for development
cors_origins = settings.cors_origins_list.copy()
if settings.DEBUG or settings.ENVIRONMENT == "development":
    # Add common development origins if not already present
    dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    for origin in dev_origins:
        if origin not in cors_origins:
            cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for validation errors to provide clearer error messages"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
            "body": "Expected format: {\"email\": \"user@example.com\", \"password\": \"password123\"}"
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to EduSense API — Neuro-Adaptive Multisensory Learning",
        "version": "1.0.0",
        "docs": "/docs",
        "research_framework": "See RESEARCH_FRAMEWORK.md for theory grounding.",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint (liveness/readiness)."""
    return {"status": "ok"}


from app.api import (
    auth,
    users,
    quizzes,
    lessons,
    activities,
    animation,
    calibration,
    cognitive,
    adaptive_content,
    content,
)
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(animation.router, prefix="/api", tags=["Visual Learning / Animation"])
app.include_router(calibration.router, prefix="/api", tags=["Calibration"])
app.include_router(cognitive.router, prefix="/api", tags=["Cognitive Load"])
app.include_router(adaptive_content.router, prefix="/api", tags=["Adaptive Content"])
app.include_router(content.router, prefix="/api", tags=["Content"])

# Uncomment as you implement them
# from app.api import progress, uploads
# app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
# app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )