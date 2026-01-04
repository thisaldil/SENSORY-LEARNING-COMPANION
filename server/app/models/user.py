"""
User Model
"""
from datetime import datetime, date, time  # Add 'time' import
from typing import Optional, List
from beanie import Document
from pydantic import EmailStr, Field


class User(Document):
    """User document model"""

    # Authentication & Basic Info
    email: EmailStr
    username: str
    hashed_password: str
    
    # Personal Information
    first_name: str
    last_name: str
    # Change these to datetime, default to 00:00:00
    date_of_birth: datetime  # Was: date

    gender: Optional[str] = None  # "male", "female", "other", "prefer_not_to_say"
    avatar_url: Optional[str] = None
    
    # Learning Preferences & Personalization
    learning_style: Optional[str] = None  # "visual", "auditory", "kinesthetic", "multisensory"
    preferred_subjects: Optional[List[str]] = None
    difficulty_level: Optional[str] = None  # "beginner", "intermediate", "advanced"
    accessibility_needs: Optional[List[str]] = None
    language: Optional[str] = "en"
    
    # Safety & Compliance (for Gen AI tools - age verification)
    parental_consent: bool = False
    consent_date: Optional[datetime] = None  # Was: Optional[date]
    
    # System Fields
    timezone: Optional[str] = None
    email_verified: bool = False
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Legacy field (keeping for backward compatibility, but can be removed later)
    profile: Optional[dict] = None

    class Settings:
        name = "users"
        indexes = ["email", "username"]

