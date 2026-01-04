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
    """Raw cognitive load features schema - direct features for model prediction
    
    All 9 features are required for the cognitive load model:
    - answerChanges: Number of times the user changed their answer
    - currentErrorStreak: Current consecutive errors
    - totalScore: Total score achieved (can be calculated from quiz results)
    - accuracyRate: Accuracy rate (0.0 to 1.0) (can be calculated from quiz results)
    - errors: Total number of errors
    - idleGapsOverThreshold: Number of idle periods over threshold
    - responseTimeVariability: Variability in response times
    - completionTime: Total time to complete (in milliseconds)
    - avgResponseTime: Average response time (in milliseconds)
    """
    
    answerChanges: float
    currentErrorStreak: float
    totalScore: float
    accuracyRate: float
    errors: float
    idleGapsOverThreshold: float
    responseTimeVariability: float
    completionTime: float
    avgResponseTime: float


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

