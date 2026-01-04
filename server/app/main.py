"""
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    description="Backend API for EduSense - Sensory Learning Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to EduSense API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Include routers
from app.api import auth, users, quizzes, lessons
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])

# Uncomment as you implement them
# from app.api import content, progress, uploads
# app.include_router(content.router, prefix="/api/content", tags=["Content"])
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

