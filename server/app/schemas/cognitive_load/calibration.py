"""
Calibration Schemas – Baseline Neuro-Diagnostic Handshake
"""
from typing import List, Optional, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field


class CalibrationQuestionInteraction(BaseModel):
    """Minimal question interaction structure used during baseline tasks."""

    question_id: str
    time_started: datetime
    time_answered: Optional[datetime] = None
    time_spent_seconds: Optional[float] = None
    answer_index: Optional[int] = None
    is_correct: Optional[bool] = None
    attempts: int = 0
    hints_used: int = 0
    times_viewed: int = 1


class CalibrationRequest(BaseModel):
    """
    Baseline calibration payload sent from the 3-task UI.

    Mirrors the structure of BehaviorLog so we can reuse the existing
    feature_extractor and cognitive_load_predictor.
    """

    total_time_seconds: float = Field(..., description="Total time across baseline tasks (seconds)")
    total_questions: int = Field(..., description="Total number of items across baseline tasks")

    question_interactions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Flattened per-question interactions from the three calibration tasks",
    )

    back_navigations: int = 0
    forward_navigations: int = 0
    answer_changes: int = 0


class CalibrationResponse(BaseModel):
    """Summary of baseline cognitive load and stored profile features."""

    baseline_state: str = Field(..., description='Discrete state: "LOW", "OPTIMAL", or "OVERLOAD"')
    confidence: float
    baseline_features: Dict[str, float]
    profile_name: str = Field(..., description='Human-readable neuro profile label (e.g., "Visual Learner")')

