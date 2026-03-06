"""
Lesson Model

Lessons contain concepts with audio scripts and haptic patterns. Haptics support
embodied cognition (concept grounding in sensorimotor experience); patterns
should be synchronized with visual/audio for key concepts (Hebbian learning).
"""
from datetime import datetime
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class Concept(Document):
    """Concept embedded in a lesson.

    audio_script drives narration; haptics_pattern supports embodied encoding
    (sensorimotor grounding). Visual + audio + haptic are synchronized for
    key concepts (Dual Coding, Hebbian learning).
    """
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
    # Snapshot of the learner's baseline load at lesson creation time
    baseline_cognitive_load: Optional[str] = None
    concepts: List[dict] = []
    visuals: List[dict] = []
    progress: float = 0.0  # 0.0 to 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lessons"
        indexes = ["user_id", "subject", "created_at"]

