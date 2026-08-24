import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 5000
    NODE_ENV: str = "development"
    CLIENT_URL: str = "http://localhost:5173"
    DATABASE_URL: str = "sqlite:///./dev.db"
    
    JWT_SECRET: str = "super_secret_healthcare_jwt_key_2026_pulse_secure"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN_DAYS: int = 7
    
    GEMINI_API_KEY: str = ""
    
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5000/api/calendar/oauth-callback"
    
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "SwasthyaPulse Healthcare <no-reply@swasthyapulse.in>"
    
    SLOT_HOLD_DURATION_MINUTES: int = 10

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("file:"):
            return "sqlite:///./dev.db"
        if not url.startswith("sqlite") and not url.startswith("postgresql"):
            return f"sqlite:///{url}"
        return url

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
