"""
Pulls text out of an uploaded resume PDF entirely in memory - the
original file is never written to disk, only the extracted text is
kept, and only for as long as this request needs it.
"""
import io

import pdfplumber

MAX_CHARS = 8000  # keeps embeddings + LLM prompts a predictable size


def extract_text(pdf_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    text = "\n".join(text_parts).strip()
    if not text:
        raise ValueError(
            "Couldn't read any text from that PDF - it might be a scanned "
            "image rather than real text. Try exporting it as a text-based "
            "PDF instead."
        )
    return text[:MAX_CHARS]
