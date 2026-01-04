"""
Progress Model
"""
from datetime import datetime
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class Progress(Document):
    """Progress tracking document model"""

    user_id: PydanticObjectId
    lesson_id: PydanticObjectId
    progress_percent: float = 0.0  # 0.0 to 100.0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    completed_concepts: List[str] = []
    time_spent_minutes: float = 0.0

    class Settings:
        name = "progress"
        indexes = ["user_id", "lesson_id"]

