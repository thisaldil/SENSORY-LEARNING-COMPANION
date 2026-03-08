"""
Sensory Overlay Schemas (Member 3 – Audio + Haptics)
"""
from typing import List, Optional, Dict, Any

from pydantic import BaseModel


class HapticCue(BaseModel):
    """Single haptic event in time (ms from animation start)."""

    at: int  # milliseconds
    pattern: str  # e.g. 'tap_soft', 'tap_strong', 'buzz_short'
    scene_id: Optional[str] = None
    channel: Optional[str] = None  # e.g. 'left', 'right', 'device'
    intensity: Optional[float] = None  # 0.0–1.0 normalized


class AudioOverlay(BaseModel):
    """Narration or structural audio cue aligned to the animation timeline."""

    at: int  # milliseconds
    text: str
    duration: int  # milliseconds


class SensoryOverlay(BaseModel):
    """Full multisensory overlay payload for one animation script."""

    cognitive_state: str
    ambient_mode: str  # 'silence' | '40hz_gamma' | 'spatial_music'
    speech_rate: str  # 'slow' | 'normal' | 'fast'
    haptics: List[HapticCue]
    narration: List[AudioOverlay]
    research_metrics: Dict[str, Any]


class SensoryOverlayRequest(BaseModel):
    """
    Request payload for Member 3 – Multimodal Sensory Overlay.

    Expects the AnimationScript JSON produced by Member 2.
    """

    script: Dict[str, Any]
    cognitive_state: str
    concept: Optional[str] = None
    student_id: Optional[str] = None
    lesson_id: Optional[str] = None
    session_id: Optional[str] = None


