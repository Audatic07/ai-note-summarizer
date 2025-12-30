"""
AI Summarizer Module - Unified interface for text summarization.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import asyncio
from ..config import get_settings

# Supported models
GROQ_DEFAULT_MODEL = "openai/gpt-oss-120b"
HUGGINGFACE_DEFAULT_MODEL = "facebook/bart-large-cnn"


class BaseSummarizer(ABC):
    """Abstract base class for AI summarizers."""
    
    # Style configurations
    STYLE_CONFIG = {
        "best_fit": "Use the most appropriate tone based on the content. For academic/technical content use formal language, for casual content use conversational tone.",
        "technical": "Use formal, precise language. Preserve technical terminology and jargon. Be objective and detailed.",
        "casual": "Use conversational, easy-to-understand language. Simplify complex terms. Be engaging and accessible."
    }
    
    @abstractmethod
    async def summarize(self, text: str, line_count: Optional[int] = None, 
                       summary_type: str = "summary", style: str = "best_fit") -> Dict[str, Any]:
        pass
    
    def _chunk_text(self, text: str, chunk_size: int = 3000) -> List[str]:
        """Split long text into chunks for processing."""
        if len(text) <= chunk_size:
            return [text]

        chunks, current = [], ""
        for sentence in text.replace('\n', ' ').split('. '):
            if len(sentence) > chunk_size:
                if current:
                    chunks.append(current.strip())
                    current = ""
                for i in range(0, len(sentence), chunk_size):
                    chunks.append(sentence[i:i + chunk_size].strip())
            elif len(current) + len(sentence) + 2 <= chunk_size:
                current += sentence + ". "
            else:
                if current:
                    chunks.append(current.strip())
                current = sentence + ". "
        if current:
            chunks.append(current.strip())
        return chunks
    
    def _get_length_instruction(self, line_count: Optional[int], text_length: int) -> tuple[str, int]:
        """Get length instruction and max tokens based on line count or auto-detect."""
        if line_count is None:
            # Auto-detect based on content length
            if text_length < 500:
                return "2-3 lines", 100
            elif text_length < 2000:
                return "4-6 lines", 200
            elif text_length < 5000:
                return "6-10 lines", 350
            elif text_length < 15000:
                return "10-15 lines", 500
            else:
                return "15-20 lines", 700
        else:
            # User specified line count
            tokens = max(50, line_count * 30)  # ~30 tokens per line
            return f"exactly {line_count} lines", min(tokens, 2000)
    
    def _get_prompt(self, summary_type: str, line_count: Optional[int], 
                   style: str, text_length: int) -> tuple[str, int]:
        """Generate prompt based on summary type, length, and style."""
        length_instruction, max_tokens = self._get_length_instruction(line_count, text_length)
        style_instruction = self.STYLE_CONFIG.get(style, self.STYLE_CONFIG["best_fit"])
        
        prompts = {
            "summary": f"Summarize the following text in {length_instruction}. {style_instruction}\n\nCapture the main points concisely:",
            "key_points": f"Extract the key points from the following text as a bulleted list ({length_instruction} worth of points). {style_instruction}:",
            "flashcards": f"Create study flashcards (Q&A format) from the following text ({length_instruction} worth of cards). {style_instruction}:"
        }
        return prompts.get(summary_type, prompts["summary"]), max_tokens


class ChatAPISummarizer(BaseSummarizer):
    """Unified summarizer for OpenAI-compatible chat APIs (OpenAI, Groq)."""
    
    def __init__(self, provider: str):
        settings = get_settings()
        self.provider = provider
        self.chunk_size = settings.chunk_size
        
        if provider == "openai":
            self.api_key = settings.openai_api_key
            self.model = settings.default_model if not settings.default_model.startswith("llama") else "gpt-3.5-turbo"
        else:  # groq
            self.api_key = settings.groq_api_key
            self.model = GROQ_DEFAULT_MODEL
    
    def _get_client(self):
        if self.provider == "openai":
            from openai import AsyncOpenAI
            return AsyncOpenAI(api_key=self.api_key)
        else:
            from groq import AsyncGroq
            return AsyncGroq(api_key=self.api_key)
    
    async def _call_api(self, client, messages: list, max_tokens: int) -> tuple:
        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3
        )
        return response.choices[0].message.content, response.usage.total_tokens if response.usage else 0
    
    async def summarize(self, text: str, line_count: Optional[int] = None, 
                       summary_type: str = "summary", style: str = "best_fit") -> Dict[str, Any]:
        """Generate a summary using chat-based API."""
        if not self.api_key:
            raise ValueError(f"{self.provider.upper()} API key not configured.")
        
        client = self._get_client()
        chunks = self._chunk_text(text, self.chunk_size)
        prompt, max_tokens = self._get_prompt(summary_type, line_count, style, len(text))
        system_msg = {"role": "system", "content": f"You are a helpful assistant that creates clear, accurate summaries. {self.STYLE_CONFIG.get(style, '')}"}
        
        if len(chunks) > 1:
            summaries, total_tokens = [], 0
            for chunk in chunks:
                content, tokens = await self._call_api(client, [system_msg, {"role": "user", "content": f"{prompt}\n\n{chunk}"}], max_tokens)
                summaries.append(content)
                total_tokens += tokens
            
            combined = "\n\n".join(summaries)
            length_instruction, _ = self._get_length_instruction(line_count, len(text))
            summary, tokens = await self._call_api(client, [
                system_msg,
                {"role": "user", "content": f"Combine and condense the following summaries into {length_instruction}:\n\n{combined}"}
            ], max_tokens * 2)
            total_tokens += tokens
        else:
            summary, total_tokens = await self._call_api(client, [system_msg, {"role": "user", "content": f"{prompt}\n\n{text}"}], max_tokens * 2)
        
        return {"summary": summary, "provider": self.provider, "model": self.model, "tokens": total_tokens}


class HuggingFaceSummarizer(BaseSummarizer):
    """Local HuggingFace summarizer using BART."""
    
    _pipeline = None
    _model_name = None
    
    def __init__(self):
        self.model_name = HUGGINGFACE_DEFAULT_MODEL
    
    def _get_pipeline(self):
        if HuggingFaceSummarizer._pipeline is None or HuggingFaceSummarizer._model_name != self.model_name:
            from transformers import pipeline
            print(f"🔄 Loading model: {self.model_name}")
            HuggingFaceSummarizer._pipeline = pipeline("summarization", model=self.model_name, device=-1)
            HuggingFaceSummarizer._model_name = self.model_name
        return HuggingFaceSummarizer._pipeline
    
    async def summarize(self, text: str, line_count: Optional[int] = None, 
                       summary_type: str = "summary", style: str = "best_fit") -> Dict[str, Any]:
        # Map line count to length params (HuggingFace doesn't support style)
        if line_count is None:
            max_length, min_length = 130, 50
        else:
            max_length = max(30, line_count * 25)
            min_length = max(10, line_count * 10)
        
        chunks = self._chunk_text(text, 800)
        
        loop = asyncio.get_event_loop()
        summaries = []
        for chunk in chunks:
            result = await loop.run_in_executor(
                None,
                lambda c=chunk: self._get_pipeline()(c, max_length=max_length, min_length=min_length, do_sample=False, truncation=True)
            )
            summaries.append(result[0]["summary_text"])
        
        summary = " ".join(summaries) if len(summaries) > 1 else summaries[0]
        return {"summary": summary, "provider": "huggingface", "model": self.model_name, "tokens": None}


class MockSummarizer(BaseSummarizer):
    """Mock summarizer for testing."""
    
    async def summarize(self, text: str, line_count: Optional[int] = None, 
                       summary_type: str = "summary", style: str = "best_fit") -> Dict[str, Any]:
        sentences = text.replace('\n', ' ').split('. ')
        num = line_count if line_count else 3
        summary = '. '.join(sentences[:num])
        return {"summary": summary + ('.' if not summary.endswith('.') else ''), "provider": "mock", "model": "mock-v1", "tokens": len(text.split())}


class SummarizerFactory:
    """Factory for creating summarizer instances."""
    
    @staticmethod
    def get_summarizer(provider: Optional[str] = None) -> BaseSummarizer:
        settings = get_settings()
        provider = provider or settings.ai_provider
        
        providers = {
            "openai": lambda: ChatAPISummarizer("openai"),
            "groq": lambda: ChatAPISummarizer("groq"),
            "huggingface": HuggingFaceSummarizer,
            "mock": MockSummarizer,
        }
        
        if provider in providers:
            return providers[provider]()
        
        # Auto-select based on available keys
        if settings.openai_api_key:
            return ChatAPISummarizer("openai")
        if settings.groq_api_key:
            return ChatAPISummarizer("groq")
        return MockSummarizer()

