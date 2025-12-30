"""Summary model for AI-generated summaries."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary_type = Column(String(50), default="summary", nullable=False)
    summary_length = Column(String(20), default="auto", nullable=False)  # "auto" or line count as string
    ai_provider = Column(String(50), nullable=False)
    ai_model = Column(String(100), nullable=False)
    generation_time_ms = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=True)
    compression_ratio = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    note = relationship("Note", back_populates="summaries")

