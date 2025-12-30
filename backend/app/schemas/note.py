"""Note schemas for API validation."""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum


class NoteSourceType(str, Enum):
    TEXT = "text"
    PDF = "pdf"
    UPLOAD = "upload"


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=100000)
    source_type: NoteSourceType = NoteSourceType.TEXT
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1, max_length=100000)
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip() if v else v


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    source_type: NoteSourceType
    original_filename: Optional[str] = None
    char_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_id: Optional[int] = None
    summary_count: int = 0
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    id: int
    title: str
    source_type: NoteSourceType
    char_count: int
    created_at: datetime
    summary_count: int = 0
    content_preview: str = ""
    
    class Config:
        from_attributes = True
