"""
Database Connection and Setup
"""
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models import User, Lesson, Quiz, QuizResult, Progress, ContentFile, ProcessingJob
from app.models.behavior import BehaviorLog


class Database:
    """Database connection manager"""

    client: AsyncIOMotorClient = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    # MongoDB Atlas connection string may include database name
    # If not, use MONGODB_DB_NAME from settings
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.database = db.client[settings.MONGODB_DB_NAME]

    # Initialize Beanie with document models
    await init_beanie(
        database=db.database,
        document_models=[
            User,
            Lesson,
            Quiz,
            QuizResult,
            Progress,
            ContentFile,
            ProcessingJob,
            BehaviorLog,
        ],
    )

    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("✅ Disconnected from MongoDB")

