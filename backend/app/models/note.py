"""Note model for user notes."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database.connection import Base


class NoteSourceType(str, enum.Enum):
    TEXT = "text"
    PDF = "pdf"
    UPLOAD = "upload"


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    source_type = Column(Enum(NoteSourceType), default=NoteSourceType.TEXT, nullable=False)
    original_filename = Column(String(255), nullable=True)
    content_hash = Column(String(64), index=True)
    char_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="notes")
    summaries = relationship("Summary", back_populates="note", cascade="all, delete-orphan")
