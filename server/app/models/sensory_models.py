"""
Sensory Session Model (Member 3 Research Dataset)

Stores audio + haptic overlay details aligned with a visual AnimationScript.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class SensorySession(Document):
    """
    Research document capturing a single multisensory overlay instance.

    This joins:
    - Member 2 animation script snapshot
    - Member 3 audio + haptics overlay
    - Cognitive/load state and timing metrics
    """

    student_id: Optional[PydanticObjectId] = None
    lesson_id: Optional[PydanticObjectId] = None
    session_id: Optional[str] = None

    concept: Optional[str] = None
    cognitive_state: str

    # Snapshot of visual script and sensory overlays
    animation_script: Dict[str, Any]
    haptic_timeline: List[Dict[str, Any]]
    audio_timeline: List[Dict[str, Any]]

    ambient_mode: str
    speech_rate: str

    research_metrics: Dict[str, Any] = Field(default_factory=dict)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sensory_sessions"
        indexes = ["student_id", "lesson_id", "session_id", "cognitive_state", "created_at"]


