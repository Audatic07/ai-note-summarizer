"""Health check routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..config import get_settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    settings = get_settings()
    return {"status": "healthy", "app_name": settings.app_name, "version": "1.0.0"}


@router.get("/db")
async def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@router.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    settings = get_settings()
    try:
        db.execute(text("SELECT 1"))
        db_status = "ready"
    except Exception:
        db_status = "not_ready"
    
    ai_status = "ready" if settings.openai_api_key else "not_configured"
    return {"status": "ready" if db_status == "ready" else "not_ready", "checks": {"database": db_status, "ai_service": ai_status}}
