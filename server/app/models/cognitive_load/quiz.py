"""
Quiz Models
"""
from datetime import datetime
from typing import List, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class QuizQuestion(Document):
    """Quiz question embedded in quiz"""

    id: str
    type: str  # "multiple" or "truefalse"
    question: str
    options: List[str]
    correct_index: int


class Quiz(Document):
    """Quiz document model"""

    lesson_id: PydanticObjectId
    user_id: PydanticObjectId
    questions: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "quizzes"
        indexes = ["lesson_id", "user_id", "created_at"]


class QuizResult(Document):
    """Quiz result document model"""

    quiz_id: PydanticObjectId
    user_id: PydanticObjectId
    answers: List[dict] = []
    score: float = 0.0
    correct_count: int = 0
    total_questions: int = 0
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    cognitive_load: Optional[str] = None  # "Low", "Medium", "High"
    cognitive_load_confidence: Optional[float] = None

    class Settings:
        name = "quiz_results"
        indexes = ["quiz_id", "user_id", "completed_at"]

