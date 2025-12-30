"""AI Note Summarizer - FastAPI Backend"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db
from .routes import notes_router, summaries_router, users_router, health_router

import asyncio
from .services.background_summarizer import warmup_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AI Note Summarizer API...")
    init_db()
    print("✅ Database initialized")

    settings = get_settings()
    if settings.ai_provider == "groq" or settings.groq_api_key:
        print("✅ Using Groq API (FREE Llama 3.1 70B - GPT-level quality!)")
        if not settings.groq_api_key:
            print("⚠️ GROQ_API_KEY not set! Get one FREE at https://console.groq.com/keys")
    elif settings.ai_provider == "huggingface":
        try:
            loop = asyncio.get_running_loop()
            print("⏳ Warming up HuggingFace summarizer...")
            await loop.run_in_executor(None, warmup_model)
            print("✅ HuggingFace model ready")
        except Exception as e:
            print(f"⚠️ HuggingFace warmup failed: {e}")
    
    yield
    print("👋 Shutting down AI Note Summarizer API...")


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="AI-powered note summarization API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(notes_router, prefix="/api")
app.include_router(summaries_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }
