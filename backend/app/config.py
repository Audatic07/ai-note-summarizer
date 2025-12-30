"""App configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    app_name: str = "AI Note Summarizer"
    debug: bool = True
    api_version: str = "v1"
    database_url: str = "sqlite:///./notes.db"
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    ai_provider: str = "openai"
    default_model: str = "gpt-3.5-turbo"
    max_text_length: int = 50000
    max_pdf_size_mb: int = 10
    chunk_size: int = 3000
    cors_origins: list[str] = ["*"]
    default_summary_length: str = "medium"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
