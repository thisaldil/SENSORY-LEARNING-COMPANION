"""
Content Models
"""
from datetime import datetime
from typing import Optional, Literal, Dict, Any
from beanie import Document, PydanticObjectId
from pydantic import Field


class ContentFile(Document):
    """Content file document model"""

    user_id: PydanticObjectId
    file_type: str  # "video" or "image"
    file_path: str
    file_url: str
    file_size: int = 0
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "content_files"
        indexes = ["user_id", "file_type", "uploaded_at"]


class ProcessingJob(Document):
    """Processing job document model"""

    user_id: PydanticObjectId
    lesson_id: Optional[PydanticObjectId] = None
    status: str = "pending"  # "pending", "processing", "completed", "failed"
    stage: str = ""
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Settings:
        name = "processing_jobs"
        indexes = ["user_id", "status", "created_at"]


class ContentObject(Document):
    """
    Adaptive content container for a lesson.

    Stores three cognitively tuned variants of the same learning object that can
    be selected at runtime based on the student's load state.
    """

    lesson_id: PydanticObjectId
    author_id: PydanticObjectId

    # Optional higher level organization
    concept_id: Optional[str] = None
    concept_title: Optional[str] = None

    modality: Literal["text", "visual", "haptic", "mixed"] = "text"

    # Three tuned versions of the same content
    low_load_json: Dict[str, Any]
    optimal_json: Dict[str, Any]
    overload_json: Dict[str, Any]

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "content_objects"
        indexes = ["lesson_id", "author_id", "modality", "created_at"]

