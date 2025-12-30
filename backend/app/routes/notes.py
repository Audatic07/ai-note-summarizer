"""Notes API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from ..services.note_service import NoteService
from ..services.pdf_service import PDFService
from ..config import get_settings

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(note_data: NoteCreate, user_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    return NoteService(db).create_note(note_data, user_id)


@router.post("/upload/pdf", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf_note(file: UploadFile = File(...), title: Optional[str] = Query(default=None), user_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    settings = get_settings()
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")
    
    content = await file.read()
    max_size = settings.max_pdf_size_mb * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File size exceeds {settings.max_pdf_size_mb}MB limit")
    
    extracted_text = PDFService().extract_text(content)
    if not extracted_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from PDF")
    
    note_title = title or file.filename.replace('.pdf', '').replace('.PDF', '')
    note_data = NoteCreate(title=note_title, content=extracted_text, source_type="pdf")
    return NoteService(db).create_note(note_data, user_id, original_filename=file.filename)


@router.get("", response_model=List[NoteListResponse])
async def list_notes(user_id: Optional[int] = Query(default=None), skip: int = Query(default=0, ge=0), limit: int = Query(default=20, ge=1, le=100), search: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    return NoteService(db).list_notes(user_id=user_id, skip=skip, limit=limit, search=search)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, db: Session = Depends(get_db)):
    note = NoteService(db).get_note(note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    note = NoteService(db).update_note(note_id, note_data)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: int, db: Session = Depends(get_db)):
    if not NoteService(db).delete_note(note_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
