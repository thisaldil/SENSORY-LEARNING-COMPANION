"""
User Schemas
"""
from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from enum import Enum


class GenderEnum(str, Enum):
    """Gender options"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class LearningStyleEnum(str, Enum):
    """Learning style options"""
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    MULTISENSORY = "multisensory"


class DifficultyLevelEnum(str, Enum):
    """Difficulty level options"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class UserSignup(BaseModel):
    """User signup schema - minimal fields required for registration"""
    
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, description="Username must be between 3-50 characters")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    # date_of_birth: date = Field(..., description="Date of birth for age verification")
    date_of_birth: datetime  # Was: date (accepts "YYYY-MM-DD" strings)
    gender: Optional[GenderEnum] = None
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v
    
    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, v: datetime) -> datetime:  # Now takes datetime
        """Validate date of birth is not in the future"""
        if v.date() > date.today():  # Use .date() to compare
            raise ValueError("Date of birth cannot be in the future")
        return v
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format"""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, hyphens, and underscores")
        return v


class UserCreate(BaseModel):
    """User creation schema - full user creation (for admin/internal use)"""

    email: EmailStr
    username: str
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    
    # Required personal information
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date = Field(..., description="Date of birth for age verification")
    
    # Optional personal information
    gender: Optional[GenderEnum] = None
    avatar_url: Optional[str] = None
    
    # Learning preferences (optional, can be set later)
    learning_style: Optional[LearningStyleEnum] = None
    preferred_subjects: Optional[List[str]] = None
    difficulty_level: Optional[DifficultyLevelEnum] = None
    accessibility_needs: Optional[List[str]] = None
    language: Optional[str] = Field(default="en", max_length=10)
    
    # Safety & Compliance - Required for children
    parental_consent: bool = Field(default=False, description="Parental consent required for users under 18")
    consent_date: Optional[date] = None
    
    # System fields
    timezone: Optional[str] = None
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v
    
    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, v: date) -> date:
        """Validate date of birth is not in the future"""
        if v > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return v


class UserLogin(BaseModel):
    """User login schema"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema"""

    id: str
    email: EmailStr
    username: str
    
    # Personal information
    first_name: str
    last_name: str
    date_of_birth: datetime  # Was: date
    gender: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Learning preferences
    learning_style: Optional[str] = None
    preferred_subjects: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    accessibility_needs: Optional[List[str]] = None
    language: Optional[str] = "en"
    
    # Safety & Compliance
    parental_consent: bool
    consent_date: Optional[datetime] = None  # Was: Optional[date]
    
    # System fields
    timezone: Optional[str] = None
    email_verified: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Legacy field
    profile: Optional[dict] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema with token and user data"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User update schema (for profile updates)"""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    gender: Optional[GenderEnum] = None
    avatar_url: Optional[str] = None
    learning_style: Optional[LearningStyleEnum] = None
    preferred_subjects: Optional[List[str]] = None
    difficulty_level: Optional[DifficultyLevelEnum] = None
    accessibility_needs: Optional[List[str]] = None
    language: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = None
    parental_consent: Optional[bool] = None
    consent_date: Optional[datetime] = None

