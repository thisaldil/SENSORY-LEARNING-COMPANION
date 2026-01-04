"""
Lesson Schemas
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ConceptSchema(BaseModel):
    """Concept schema"""

    id: str
    title: str
    description: str
    audio_script: str
    haptics_pattern: dict
    micro_label: Optional[str] = None


class LessonCreate(BaseModel):
    """Lesson creation schema"""

    title: str
    subject: str
    content: str


class LessonResponse(BaseModel):
    """Lesson response schema"""

    id: str
    user_id: str
    title: str
    subject: str
    content: str
    concepts: List[dict] = []
    visuals: List[dict] = []
    progress: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

