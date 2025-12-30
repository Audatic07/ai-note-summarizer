"""User API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas.user import UserCreate, UserResponse
from ..services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: Optional[UserCreate] = None, db: Session = Depends(get_db)):
    if user_data is None:
        user_data = UserCreate(is_guest=True)
    return UserService(db).create_user(user_data)


@router.get("/guest/{guest_id}", response_model=UserResponse)
async def get_user_by_guest_id(guest_id: str, db: Session = Depends(get_db)):
    user = UserService(db).get_by_guest_id(guest_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserService(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
