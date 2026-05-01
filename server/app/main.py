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
    """Custom handler for validation errors; keeps FastAPI-style detail for frontend parsing."""
    errors = []
    detail_list = []
    for error in exc.errors():
        loc = error["loc"]
        msg = error["msg"]
        field = " -> ".join(str(x) for x in loc)
        errors.append({
            "field": field,
            "message": msg,
            "type": error["type"]
        })
        detail_list.append({"loc": list(loc), "msg": msg, "type": error["type"]})

    # Single message for simple display; frontends can use detail (array) for field-level errors
    first_msg = errors[0]["message"] if errors else "Validation error"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": detail_list,  # FastAPI-style so frontend can parse loc/msg
            "message": first_msg,
            "errors": errors,
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


from app.api import auth, users, quizzes, lessons, activities, sensory, progress
from app.api.visual import animation
from app.api.cognitive_load import calibration, cognitive, adaptive_content
from app.api.nlp import content, content_ollama_demo
from app.api import tts
from app.api import voice_clone
from app.api import vision_notes, vision_notes_local_demo
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
app.include_router(content_ollama_demo.router, prefix="/api", tags=["Content Demo"])
app.include_router(sensory.router, prefix="/api", tags=["Sensory Overlay"])
app.include_router(tts.router, prefix="/api", tags=["TTS"])
# Voice clone (Coqui XTTS): POST /tts/voice-clone with form-data text + speaker_wav → WAV
app.include_router(voice_clone.router)
app.include_router(vision_notes.router, prefix="/api", tags=["Vision Notes"])
app.include_router(vision_notes_local_demo.router, prefix="/api", tags=["Vision Notes Demo"])

app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )