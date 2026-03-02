"""
MongoDB model for animation scripts (Motor async – Visual Learning Platform).
Uses separate DB (e.g. visualScience) for animation cache.
"""
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


class AnimationModel:
    """MongoDB model for animation scripts."""

    def __init__(self):
        uri = getattr(settings, "MONGODB_URL", None) or getattr(settings, "MONGO_URI", None)
        if not uri:
            import os
            uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/visualScience")
        self.client = AsyncIOMotorClient(uri)
        db_name = getattr(settings, "MONGODB_VISUAL_DB_NAME", "visualScience")
        self.db = self.client[db_name]
        self.collection = self.db.animations

    async def find_one(self, concept: str) -> Optional[dict[str, Any]]:
        """Find animation by concept."""
        return await self.collection.find_one({"concept": concept})

    async def create(self, concept: str, script: dict, source: str) -> dict[str, Any]:
        """Create new animation record."""
        from datetime import datetime

        document = {
            "concept": concept,
            "script": script,
            "source": source,
            "createdAt": datetime.utcnow(),
        }
        result = await self.collection.insert_one(document)
        return {"id": str(result.inserted_id), **document}

    async def delete_one(self, concept: str) -> None:
        """Delete animation by concept."""
        await self.collection.delete_one({"concept": concept})

    async def close(self) -> None:
        """Close database connection."""
        self.client.close()
