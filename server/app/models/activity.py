"""
Activity Model – Concept Playground activities stored in MongoDB
"""
from typing import List, Optional, Any

from beanie import Document


class Activity(Document):
    """Activity document for the Concept Playground."""

    topic: str
    cognitive_load: str  # LOW | MEDIUM | HIGH
    activity_type: str  # TRUE_FALSE | MCQ | MATCHING | FILL_BLANK_WORD_BANK
    difficulty_level: str  # basic | intermediate | advanced
    title: str
    instructions: str
    estimated_time: int  # minutes
    points: int
    items: List[Any] = []  # type-specific item structures
    feedback: Optional[dict] = None
    word_bank: Optional[List[str]] = None  # for FILL_BLANK_WORD_BANK

    class Settings:
        name = "activities"
        indexes = ["topic", "cognitive_load", "activity_type"]
