"""
Lesson Model
"""
from datetime import datetime
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class Concept(Document):
    """Concept embedded in lesson"""

    id: str
    title: str
    description: str
    audio_script: str
    haptics_pattern: dict
    micro_label: Optional[str] = None


class Lesson(Document):
    """Lesson document model"""

    user_id: PydanticObjectId
    title: str
    subject: str
    content: str
    concepts: List[dict] = []
    visuals: List[dict] = []
    progress: float = 0.0  # 0.0 to 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lessons"
        indexes = ["user_id", "subject", "created_at"]

