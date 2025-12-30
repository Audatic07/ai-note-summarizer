"""Summary API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import asyncio

from ..database import get_db
from ..schemas.summary import SummaryRequest, SummaryResponse
from ..services.summary_service import SummaryService
from ..services.note_service import NoteService
from ..services.background_summarizer import create_summary_job, get_job, process_summary_job, JobStatus

router = APIRouter(prefix="/summaries", tags=["Summaries"])


@router.post("/notes/{note_id}", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
async def generate_summary(note_id: int, request: SummaryRequest = SummaryRequest(), db: Session = Depends(get_db)):
    note = NoteService(db).get_note(note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    try:
        return await SummaryService(db).generate_summary(
            note_id=note_id, 
            content=note.content, 
            line_count=request.line_count,
            summary_type=request.summary_type.value,
            summary_style=request.summary_style.value,
            force_regenerate=request.force_regenerate
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Summary generation failed: {str(e)}")


@router.post("/notes/{note_id}/async")
async def generate_summary_async(note_id: int, background_tasks: BackgroundTasks, request: SummaryRequest = SummaryRequest(), db: Session = Depends(get_db)):
    note = NoteService(db).get_note(note_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    length_str = str(request.line_count) if request.line_count else "auto"
    
    if not request.force_regenerate:
        existing = SummaryService(db)._get_existing_summary(note_id, length_str, request.summary_type.value, request.summary_style.value)
        if existing:
            return {"job_id": None, "status": "completed", "progress": 100, "cached": True, 
                    "summary": {
                        "id": existing.id, "content": existing.content, 
                        "summary_type": existing.summary_type, "summary_length": existing.summary_length,
                        "summary_style": request.summary_style.value,
                        "ai_provider": existing.ai_provider, "ai_model": existing.ai_model,
                        "generation_time_ms": existing.generation_time_ms, "token_count": existing.token_count,
                        "compression_ratio": existing.compression_ratio, "created_at": existing.created_at.isoformat()
                    }}
    
    job = create_summary_job(
        note_id, 
        line_count=request.line_count,
        summary_type=request.summary_type.value,
        summary_style=request.summary_style.value
    )
    print(f"🚀 Creating async task for job {job.job_id}")
    task = asyncio.create_task(process_summary_job(
        job, note.content, request.line_count, 
        request.summary_type.value, request.summary_style.value
    ))
    print(f"✅ Task created: {task}")
    return {"job_id": job.job_id, "status": job.status.value, "progress": job.progress, "cached": False}


@router.get("/jobs/{job_id}")
async def get_summary_job_status(job_id: str, request: SummaryRequest = None, db: Session = Depends(get_db)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    response = {"job_id": job.job_id, "status": job.status.value, "progress": job.progress, "error": job.error}
    
    if job.status == JobStatus.COMPLETED and job.result:
        from ..models.summary import Summary
        length_str = str(job.line_count) if job.line_count else "auto"
        summary = Summary(
            note_id=job.note_id, 
            content=job.result["summary"], 
            summary_type=job.summary_type,
            summary_length=length_str,
            ai_provider=job.result["provider"], 
            ai_model=job.result["model"],
            generation_time_ms=int((job.completed_at - job.created_at).total_seconds() * 1000) if job.completed_at else 0,
            token_count=job.result.get("tokens"), 
            compression_ratio=0
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        response["summary"] = {
            "id": summary.id, "content": summary.content, 
            "summary_type": summary.summary_type, "summary_length": summary.summary_length,
            "summary_style": job.summary_style,
            "ai_provider": summary.ai_provider, "ai_model": summary.ai_model,
            "generation_time_ms": summary.generation_time_ms, "token_count": summary.token_count,
            "compression_ratio": summary.compression_ratio, "created_at": summary.created_at.isoformat()
        }
    
    return response


@router.get("/notes/{note_id}", response_model=List[SummaryResponse])
async def get_note_summaries(note_id: int, db: Session = Depends(get_db)):
    if not NoteService(db).get_note(note_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return SummaryService(db).get_summaries_for_note(note_id)


@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(summary_id: int, db: Session = Depends(get_db)):
    summary = SummaryService(db).get_summary(summary_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")
    return summary


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary(summary_id: int, db: Session = Depends(get_db)):
    if not SummaryService(db).delete_summary(summary_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")

