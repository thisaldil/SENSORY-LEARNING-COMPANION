"""
Content Models
"""
from datetime import datetime
from typing import Optional
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

