"""User schemas for API validation."""

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    display_name: Optional[str] = Field("Guest User", max_length=100)
    email: Optional[EmailStr] = None
    is_guest: bool = True


class UserResponse(BaseModel):
    id: int
    guest_id: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_guest: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
