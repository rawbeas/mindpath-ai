import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_firebase
from app.routers import admin, career, counsellor, journal, users

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Firebase ──────────────────────────────────────────────
    init_firebase()

    # ── Pre-load ML models ────────────────────────────────────
    # Downloads happen once and cache locally. Pre-loading here
    # means the first real request is fast instead of making the
    # user wait 30-60 seconds for a model download mid-request.
    try:
        logger.info("Pre-loading GoEmotions model…")
        from app.emotion_model import _get_classifier
        _get_classifier()
        logger.info("GoEmotions model ready.")
    except Exception as exc:
        logger.warning("GoEmotions model pre-load failed (will retry on first use): %s", exc)

    try:
        logger.info("Pre-loading sentence-transformers model…")
        from app.embeddings import _get_model
        _get_model()
        logger.info("Sentence-transformers model ready.")
    except Exception as exc:
        logger.warning("Sentence-transformers pre-load failed (will retry on first use): %s", exc)

    yield


app = FastAPI(title="MindPath AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(users.router)
app.include_router(journal.router)
app.include_router(counsellor.router)
app.include_router(admin.router)
app.include_router(career.router)