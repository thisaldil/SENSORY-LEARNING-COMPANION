"""
Application Configuration
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # App
    APP_NAME: str = "EduSense API"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        """Parse DEBUG from various formats"""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes")
        return False

    # MongoDB Atlas
    MONGODB_URL: str = "mongodb+srv://tdimith10_db_user:4InGHnwr5lDqFSUx@cluster0.fbhfkmu.mongodb.net/"
    MONGODB_DB_NAME: str = "edusense"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081,exp://localhost:8081"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB

    # ML Models
    ML_MODELS_DIR: str = "app/ml/models"

    class Config:
        env_file = ".env"
        case_sensitive = True
        # Ignore system environment variables that conflict
        env_ignore_empty = True


settings = Settings()

