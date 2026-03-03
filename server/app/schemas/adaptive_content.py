"""
Adaptive Content Schemas – ContentObject access
"""
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class AdaptiveContentRequest(BaseModel):
    """Request a particular lesson/concept variant for a given load state."""

    lesson_id: str = Field(..., description="Lesson ID as string")
    state: str = Field(..., description='"LOW", "OPTIMAL", or "OVERLOAD"')
    concept_id: Optional[str] = Field(
        default=None,
        description="Optional concept identifier inside the lesson",
    )


class AdaptiveContentResponse(BaseModel):
    """Returns the selected content JSON and some metadata."""

    lesson_id: str
    concept_id: Optional[str] = None
    state: str
    content: Dict[str, Any]

