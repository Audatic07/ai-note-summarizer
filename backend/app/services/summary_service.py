"""Summary service for AI summarization."""

from sqlalchemy.orm import Session
from typing import Optional, List
import time

from ..models.summary import Summary
from .summarizer import SummarizerFactory


class SummaryService:
    def __init__(self, db: Session):
        self.db = db
        self.summarizer = SummarizerFactory.get_summarizer()
    
    def _get_existing_summary(self, note_id: int, length: str, type: str, style: str) -> Optional[Summary]:
        return self.db.query(Summary).filter(
            Summary.note_id == note_id,
            Summary.summary_length == length,
            Summary.summary_type == type
        ).order_by(Summary.created_at.desc()).first()
    
    async def generate_summary(
        self, 
        note_id: int, 
        content: str, 
        line_count: Optional[int] = None,
        summary_type: str = "summary", 
        summary_style: str = "best_fit",
        force_regenerate: bool = False
    ) -> Summary:
        # Convert line_count to string for storage
        length_str = str(line_count) if line_count else "auto"
        
        if not force_regenerate:
            existing = self._get_existing_summary(note_id, length_str, summary_type, summary_style)
            if existing:
                return existing
        
        start_time = time.time()
        result = await self.summarizer.summarize(
            text=content, 
            line_count=line_count, 
            summary_type=summary_type,
            style=summary_style
        )
        generation_time_ms = int((time.time() - start_time) * 1000)
        
        summary_len = len(result["summary"])
        compression_ratio = len(content) / summary_len if summary_len > 0 else 0
        
        summary = Summary(
            note_id=note_id,
            content=result["summary"],
            summary_type=summary_type,
            summary_length=length_str,
            ai_provider=result["provider"],
            ai_model=result["model"],
            generation_time_ms=generation_time_ms,
            token_count=result.get("tokens"),
            compression_ratio=round(compression_ratio, 2)
        )
        
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        return summary
    
    def get_summaries_for_note(self, note_id: int) -> List[Summary]:
        return self.db.query(Summary).filter(Summary.note_id == note_id).order_by(Summary.created_at.desc()).all()
    
    def get_summary(self, summary_id: int) -> Optional[Summary]:
        return self.db.query(Summary).filter(Summary.id == summary_id).first()
    
    def delete_summary(self, summary_id: int) -> bool:
        summary = self.db.query(Summary).filter(Summary.id == summary_id).first()
        if not summary:
            return False
        self.db.delete(summary)
        self.db.commit()
        return True

