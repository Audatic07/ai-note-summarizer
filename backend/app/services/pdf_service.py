"""PDF text extraction service."""

from typing import Optional
import re


class PDFService:
    def __init__(self):
        self._extractor = None
        try:
            import pdfplumber
            self._extractor = "pdfplumber"
        except ImportError:
            pass
        if not self._extractor:
            try:
                import fitz
                self._extractor = "pymupdf"
            except ImportError:
                pass
    
    def extract_text(self, pdf_content: bytes) -> str:
        if self._extractor == "pymupdf":
            return self._extract_with_pymupdf(pdf_content)
        elif self._extractor == "pdfplumber":
            return self._extract_with_pdfplumber(pdf_content)
        raise ValueError("No PDF library available. Install pymupdf or pdfplumber")
    
    def _extract_with_pymupdf(self, pdf_content: bytes) -> str:
        import fitz
        text_parts = []
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        try:
            for page_num in range(len(doc)):
                text = doc[page_num].get_text("text")
                if text.strip():
                    text_parts.append(text)
        finally:
            doc.close()
        return self._clean_text("\n\n".join(text_parts))
    
    def _extract_with_pdfplumber(self, pdf_content: bytes) -> str:
        import pdfplumber
        import io
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    text_parts.append(text)
        return self._clean_text("\n\n".join(text_parts))
    
    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
        text = re.sub(r'\n\s*Page \d+\s*\n', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r' *\n *', '\n', text)
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(lines).strip()
    
    def is_available(self) -> bool:
        return self._extractor is not None
    
    def get_extractor_name(self) -> Optional[str]:
        return self._extractor
