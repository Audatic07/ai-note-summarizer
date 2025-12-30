"""User model for guest and registered users."""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(String(36), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    display_name = Column(String(100), default="Guest User")
    is_guest = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
