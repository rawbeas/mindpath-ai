"""
Resume-vs-job-description match score using sentence-transformers,
running entirely on this machine - no API call, no cost, same model
used regardless of how many analyses you run.
"""
import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def gap_score(resume_text: str, job_description: str) -> int:
    """Cosine similarity between the two texts' embeddings, scaled to 0-100."""
    model = _get_model()
    a, b = model.encode([resume_text, job_description])
    similarity = float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    similarity = max(0.0, min(1.0, similarity))  # defensive clamp
    return round(similarity * 100)
