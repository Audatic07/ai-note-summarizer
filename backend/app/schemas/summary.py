"""Summary schemas for API validation."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class SummaryStyle(str, Enum):
    """Summary writing style."""
    BEST_FIT = "best_fit"      # AI decides best style
    TECHNICAL = "technical"    # Formal, precise, jargon-preserved
    CASUAL = "casual"          # Conversational, easy to understand


class SummaryType(str, Enum):
    """Type of summary output."""
    SUMMARY = "summary"
    KEY_POINTS = "key_points"
    FLASHCARDS = "flashcards"


class SummaryRequest(BaseModel):
    """Request to generate a summary."""
    line_count: Optional[int] = Field(
        default=None,
        ge=1,
        le=200,
        description="Number of lines for summary (1-200). None/empty = AI decides based on content"
    )
    summary_type: SummaryType = SummaryType.SUMMARY
    summary_style: SummaryStyle = SummaryStyle.BEST_FIT
    force_regenerate: bool = False


class SummaryResponse(BaseModel):
    """Summary response model."""
    id: int
    note_id: int
    content: str
    summary_type: str
    summary_length: str  # Now stores line count or "auto"
    summary_style: str = "best_fit"
    ai_provider: str
    ai_model: str
    generation_time_ms: Optional[int] = None
    token_count: Optional[int] = None
    compression_ratio: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

