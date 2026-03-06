"""
Neuro-Adaptive Visual Script – per-student, per-lesson visual log.

Stores the JSON script produced by Member 2's Neuro-Adaptive Visual Engine so
that the frontend can fetch the "latest visual explanation" without recomputing.
"""
from datetime import datetime
from typing import Any, Dict, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class NeuroAdaptiveVisualScript(Document):
    """
    One visual script instance for a given lesson, student, and session.

    This is the visual counterpart to `TransmutedContent` for Member 1.
    """

    lesson_id: Optional[PydanticObjectId] = None
    student_id: Optional[PydanticObjectId] = None
    session_id: Optional[str] = None

    concept: str
    cognitive_state: str
    tier: str

    # JSON animation manifest (AnimationScript shape + meta)
    script: Dict[str, Any]

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "neuro_adaptive_visual_scripts"
        indexes = ["lesson_id", "student_id", "session_id", "concept", "created_at"]

