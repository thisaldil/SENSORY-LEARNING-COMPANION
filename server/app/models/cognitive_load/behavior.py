"""
Behavior Logging Model
Tracks student interactions during quiz taking for cognitive load analysis
"""
from datetime import datetime
from typing import List, Optional, Dict
from beanie import Document, PydanticObjectId
from pydantic import Field


class QuestionInteraction(Document):
    """Individual question interaction data"""
    
    question_id: str
    time_started: datetime
    time_answered: Optional[datetime] = None
    time_spent_seconds: Optional[float] = None
    answer_index: Optional[int] = None
    is_correct: Optional[bool] = None
    attempts: int = 0  # Number of times user changed answer
    hints_used: int = 0
    times_viewed: int = 1  # How many times question was viewed


class BehaviorLog(Document):
    """Behavior log for a quiz session"""
    
    quiz_id: PydanticObjectId
    user_id: PydanticObjectId
    lesson_id: PydanticObjectId
    
    # Session timing
    session_started: datetime = Field(default_factory=datetime.utcnow)
    session_completed: Optional[datetime] = None
    total_time_seconds: Optional[float] = None
    
    # Question interactions
    question_interactions: List[Dict] = []
    
    # Behavioral metrics
    total_questions: int = 0
    questions_answered: int = 0
    questions_skipped: int = 0
    average_time_per_question: Optional[float] = None
    longest_time_question: Optional[float] = None
    shortest_time_question: Optional[float] = None
    
    # Interaction patterns
    back_navigations: int = 0  # Times user went back to previous question
    forward_navigations: int = 0
    answer_changes: int = 0  # Total number of answer changes
    
    # Performance metrics
    correct_answers: int = 0
    incorrect_answers: int = 0
    accuracy_rate: Optional[float] = None
    
    # Cognitive load prediction (will be filled after analysis)
    predicted_cognitive_load: Optional[str] = None  # "Low", "Medium", "High"
    cognitive_load_confidence: Optional[float] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "behavior_logs"
        indexes = ["quiz_id", "user_id", "lesson_id", "session_started"]

