"""Background job queue for async summarization."""

import asyncio
import uuid
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from .summarizer import SummarizerFactory


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class SummaryJob:
    job_id: str
    note_id: int
    status: JobStatus = JobStatus.PENDING
    progress: int = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    # Request parameters for creating summary record
    line_count: Optional[int] = None
    summary_type: str = "summary"
    summary_style: str = "best_fit"


_jobs: Dict[str, SummaryJob] = {}


def warmup_model():
    """Pre-load HuggingFace model for faster first inference."""
    try:
        from transformers import pipeline
        pipeline("summarization", model="facebook/bart-large-cnn")
    except Exception:
        pass


def create_summary_job(
    note_id: int, 
    line_count: Optional[int] = None,
    summary_type: str = "summary",
    summary_style: str = "best_fit"
) -> SummaryJob:
    job_id = str(uuid.uuid4())
    job = SummaryJob(
        job_id=job_id, 
        note_id=note_id,
        line_count=line_count,
        summary_type=summary_type,
        summary_style=summary_style
    )
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[SummaryJob]:
    return _jobs.get(job_id)


def cleanup_old_jobs(max_age_seconds: int = 3600):
    now = datetime.now()
    to_remove = [job_id for job_id, job in _jobs.items() if (now - job.created_at).total_seconds() > max_age_seconds]
    for job_id in to_remove:
        del _jobs[job_id]


async def process_summary_job(
    job: SummaryJob, 
    text: str, 
    line_count: Optional[int] = None,
    summary_type: str = "summary",
    summary_style: str = "best_fit"
):
    """Process a summary job asynchronously."""
    job.status = JobStatus.PROCESSING
    job.progress = 10
    try:
        print(f"📝 Getting summarizer...")
        summarizer = SummarizerFactory.get_summarizer()
        print(f"🤖 Using summarizer: {type(summarizer).__name__}")
        result = await summarizer.summarize(
            text=text, 
            line_count=line_count, 
            summary_type=summary_type,
            style=summary_style
        )
        print(f"✅ Summary generated successfully!")
        job.result = result
        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.completed_at = datetime.now()
        print(f"✅ Job {job.job_id} completed successfully")
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"❌ Job {job.job_id} failed: {error_msg}")
        print(traceback.format_exc())
        
        # Provide user-friendly error messages
        if "rate_limit" in error_msg.lower() or "429" in error_msg:
            job.error = "AI service rate limit reached. Please wait a few minutes and try again."
        elif "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            job.error = "AI service authentication error. Please check API configuration."
        else:
            job.error = error_msg
        
        job.status = JobStatus.FAILED
        job.completed_at = datetime.now()

