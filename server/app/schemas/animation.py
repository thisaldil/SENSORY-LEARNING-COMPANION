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
