"""
Adaptive Content Schemas – ContentObject access
"""
from typing import Optional, Dict, Any, List

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


class TransmuteRequest(BaseModel):
    """Request body for the Adaptive Text Engine."""

    text: str = Field(..., description="Raw input text to be transmuted")
    cognitive_state: str = Field(
        ...,
        description='"LOW_LOAD", "OPTIMAL", or "OVERLOAD"',
        examples=["LOW_LOAD", "OPTIMAL", "OVERLOAD"],
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session identifier from the frontend (per learning session).",
    )


class TransmuteResponse(BaseModel):
    """Response for /api/v1/transmute – research‑grade observability."""

    original_complexity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized [0.0–1.0] complexity score combining readability and dependency distance.",
    )
    flesch_kincaid_grade: float = Field(
        ...,
        description="Flesch‑Kincaid grade level for the original text.",
    )
    dependency_distance: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized [0.0–1.0] average dependency distance proxying syntactic load.",
    )
    keywords_preserved: List[str] = Field(
        ...,
        description="High‑value TF‑IDF keywords that appear in both original and transmuted text.",
    )
    transmuted_text: str = Field(
        ...,
        description="Output text after tiered LLM transmutation.",
    )
    tier_applied: str = Field(
        ...,
        description="Tier 1 / Tier 2 / Tier 3 description applied by the State Router.",
    )
    llm_error: Optional[str] = Field(
        default=None,
        description="Optional error message if the LLM call failed and the system fell back to the original text.",
    )


