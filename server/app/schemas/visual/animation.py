"""
Animation API Schemas – Visual Learning Platform.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class Actor(BaseModel):
    type: str
    x: int
    y: int
    animation: str
    color: Optional[str] = None
    count: Optional[int] = 1
    extra: Optional[Dict[str, Any]] = None


class Scene(BaseModel):
    id: str
    startTime: int
    duration: int
    text: str
    actors: List[Actor]


class AnimationScript(BaseModel):
    title: str
    duration: int
    scenes: List[Scene]


class AnimationRequest(BaseModel):
    concept: str


class AnimationResponse(BaseModel):
    script: dict  # JSON script
    source: str  # 'cached' | 'generated_hybrid' | 'generated_legacy' | 'prebuilt'
    concept: str


class NeuroAdaptiveAnimationRequest(BaseModel):
    """
    Request payload for Member 2 – Neuro-Adaptive Visual Engine.

    Typically created from a TransmutedContent document:
    - transmuted_text  -> output.transmuted_text
    - cognitive_state  -> input.cognitive_state
    """

    transmuted_text: str
    cognitive_state: str
    concept: Optional[str] = None
    student_id: Optional[str] = None
    lesson_id: Optional[str] = None
    session_id: Optional[str] = None


class NeuroAdaptiveAnimationResponse(BaseModel):
    script: dict  # JSON animation manifest (AnimationScript shape + meta)
    source: str  # 'neuro_adaptive_rule_based' (for now)
    concept: str
    cognitive_state: str
    tier: str
    student_id: Optional[str] = None
    lesson_id: Optional[str] = None
    session_id: Optional[str] = None
