"""
Quiz Schemas
"""
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel


class QuestionSchema(BaseModel):
    """Question schema"""

    id: str
    type: str
    question: str
    options: List[str]
    correct_index: int


class QuizGenerateRequest(BaseModel):
    """Quiz generation request schema"""

    lesson_id: str


class AnswerSchema(BaseModel):
    """Answer schema for quiz submission"""
    
    question_id: str
    answer_index: int


class QuestionInteractionSchema(BaseModel):
    """Question interaction data schema"""
    
    question_id: Optional[str] = None
    time_started: Optional[str] = None  # ISO datetime string
    time_answered: Optional[str] = None  # ISO datetime string
    time_spent_seconds: Optional[float] = None
    answer_index: Optional[int] = None
    attempts: int = 0
    hints_used: int = 0
    times_viewed: int = 1


class BehaviorDataSchema(BaseModel):
    """Behavior data schema for quiz session"""
    
    session_started: Optional[str] = None  # ISO datetime string
    session_completed: Optional[str] = None  # ISO datetime string
    total_time_seconds: Optional[float] = None
    question_interactions: List[QuestionInteractionSchema] = []
    back_navigations: int = 0
    forward_navigations: int = 0
    answer_changes: int = 0


class CognitiveLoadFeaturesSchema(BaseModel):
    """Raw cognitive load features schema - direct features for model prediction"""
    
    answerChanges: float
    currentErrorStreak: float
    idleGapsOverThreshold: float
    responseTimeVariability: float
    completionTime: float
    avgResponseTime: float
    # Note: 'errors' is optional - it's not used by the model (removed as data leakage during training)
    # but can be included in requests for logging/analytics purposes
    errors: Optional[float] = None


class QuizSubmitRequest(BaseModel):
    """Quiz submission request schema"""

    answers: List[AnswerSchema]
    behavior_data: Optional[BehaviorDataSchema] = None
    cognitive_load_features: Optional[CognitiveLoadFeaturesSchema] = None


class QuizResponse(BaseModel):
    """Quiz response schema"""

    id: str
    lesson_id: str
    user_id: str
    questions: List[dict] = []
    created_at: datetime

    class Config:
        from_attributes = True


class QuizResultResponse(BaseModel):
    """Quiz result response schema"""

    id: str
    quiz_id: str
    user_id: str
    score: float
    correct_count: int
    total_questions: int
    completed_at: datetime
    cognitive_load: Optional[str] = None  # "Low", "Medium", "High"
    cognitive_load_confidence: Optional[float] = None

    class Config:
        from_attributes = True

