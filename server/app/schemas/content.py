"""
Content Processing Schemas
"""
from typing import Optional
from pydantic import BaseModel


class ContentProcessRequest(BaseModel):
    """Content processing request schema"""

    text: str
    subject: str
    user_preferences: Optional[dict] = None


class ContentProcessResponse(BaseModel):
    """Content processing response schema"""

    job_id: str
    status: str
    message: str


class ProcessingStatusResponse(BaseModel):
    """Processing status response schema"""

    job_id: str
    status: str
    stage: str
    progress: Optional[float] = None
    error_message: Optional[str] = None

