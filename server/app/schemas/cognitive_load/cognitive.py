"""
Cognitive Load Prediction Schemas – Real-time Classifier
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from pydantic import BaseModel, Field


class PredictQuestionInteraction(BaseModel):
    """Question-level interaction used for real-time predictions."""

    question_id: str
    time_started: Optional[datetime] = None
    time_answered: Optional[datetime] = None
    time_spent_seconds: Optional[float] = None
    answer_index: Optional[int] = None
    is_correct: Optional[bool] = None
    attempts: int = 0
    hints_used: int = 0
    times_viewed: int = 1


class PredictRequest(BaseModel):
    """
    Real-time cognitive load prediction payload.

    Can be sent after a small activity/section without requiring a full quiz.
    """

    total_time_seconds: float = Field(..., description="Time spent in this activity/section (seconds)")
    total_questions: int = Field(..., description="Number of questions/items in this activity")

    question_interactions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Per-question interactions for this activity/section",
    )

    back_navigations: int = 0
    forward_navigations: int = 0
    answer_changes: int = 0

    correct_answers: int = 0
    incorrect_answers: int = 0


class PredictResponse(BaseModel):
    """Current load state for this activity."""

    state: str = Field(..., description='"LOW", "OPTIMAL", or "OVERLOAD"')
    confidence: float
    features: Dict[str, float]

