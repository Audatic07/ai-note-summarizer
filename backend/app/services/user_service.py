"""User service."""

from sqlalchemy.orm import Session
from typing import Optional
import uuid

from ..models.user import User
from ..schemas.user import UserCreate


class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> User:
        guest_id = str(uuid.uuid4()) if user_data.is_guest else None
        user = User(
            guest_id=guest_id,
            email=user_data.email if hasattr(user_data, 'email') else None,
            display_name=user_data.display_name,
            is_guest=user_data.is_guest
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_guest_id(self, guest_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.guest_id == guest_id).first()
    
    def get_or_create_guest(self, guest_id: Optional[str] = None) -> User:
        if guest_id:
            user = self.get_by_guest_id(guest_id)
            if user:
                return user
        return self.create_user(UserCreate(is_guest=True))
