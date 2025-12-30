"""Note service for business logic."""

from sqlalchemy.orm import Session
from typing import Optional, List
import hashlib

from ..models.note import Note, NoteSourceType
from ..models.summary import Summary
from ..schemas.note import NoteCreate, NoteUpdate, NoteListResponse


class NoteService:
    def __init__(self, db: Session):
        self.db = db
    
    def _compute_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def create_note(self, data: NoteCreate, user_id: Optional[int] = None, original_filename: Optional[str] = None) -> Note:
        note = Note(
            title=data.title,
            content=data.content,
            source_type=NoteSourceType(data.source_type.value),
            user_id=user_id,
            original_filename=original_filename,
            content_hash=self._compute_hash(data.content),
            char_count=len(data.content)
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note
    
    def get_note(self, note_id: int) -> Optional[Note]:
        note = self.db.query(Note).filter(Note.id == note_id).first()
        if note:
            note.summary_count = self.db.query(Summary).filter(Summary.note_id == note_id).count()
        return note
    
    def list_notes(self, user_id: Optional[int] = None, skip: int = 0, limit: int = 20, search: Optional[str] = None) -> List[NoteListResponse]:
        query = self.db.query(Note)
        if user_id is not None:
            query = query.filter(Note.user_id == user_id)
        if search:
            query = query.filter(Note.title.ilike(f"%{search}%"))
        
        notes = query.order_by(Note.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for note in notes:
            summary_count = self.db.query(Summary).filter(Summary.note_id == note.id).count()
            result.append(NoteListResponse(
                id=note.id,
                title=note.title,
                source_type=note.source_type.value,
                char_count=note.char_count,
                created_at=note.created_at,
                summary_count=summary_count,
                content_preview=note.content[:200] + "..." if len(note.content) > 200 else note.content
            ))
        return result
    
    def update_note(self, note_id: int, data: NoteUpdate) -> Optional[Note]:
        note = self.db.query(Note).filter(Note.id == note_id).first()
        if not note:
            return None
        
        if data.title is not None:
            note.title = data.title
        if data.content is not None:
            note.content = data.content
            note.char_count = len(data.content)
            note.content_hash = self._compute_hash(data.content)
        
        self.db.commit()
        self.db.refresh(note)
        note.summary_count = self.db.query(Summary).filter(Summary.note_id == note_id).count()
        return note
    
    def delete_note(self, note_id: int) -> bool:
        note = self.db.query(Note).filter(Note.id == note_id).first()
        if not note:
            return False
        self.db.delete(note)
        self.db.commit()
        return True
