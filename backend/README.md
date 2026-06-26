# MindPath AI — Backend Reference

> **Full setup walkthrough is in the root `README.md`. Start there.**
> This file is a quick reference once you've already gone through setup.

## Folder layout

```
backend/
  main.py                    ← FastAPI app, CORS, lifespan, router registration
  requirements.txt           ← all Python dependencies
  .env.example               ← copy to .env and fill in
  firebase-service-account.json  ← YOU create this (see root README Step 6)

  app/
    config.py                ← reads .env into typed Settings object
    database.py              ← Firebase Admin SDK init, get_db() helper
    security.py              ← JWT verification, get_current_user, require_role()
    schemas.py               ← all Pydantic request/response models
                               (two different schemas for same journal doc = privacy wall)
    emotion_model.py         ← GoEmotions BERT wrapper, analyze() function
    risk_engine.py           ← grief+fear+sadness threshold → riskFlag
    llm_client.py            ← Gemini via OpenAI-compatible endpoint
    embeddings.py            ← all-MiniLM-L6-v2 cosine-similarity gap score
    resume_parser.py         ← pdfplumber text extraction, in-memory only

    routers/
      users.py               ← GET/PATCH/DELETE /users/me
      journal.py             ← POST /journal/submit, GET /journal/history, DELETE
      counsellor.py          ← /counsellor/students, /alerts, /entries/notes
      admin.py               ← /admin/users, /stats, /analytics
      career.py              ← /career/analyze, /history, /results, /interview/feedback

  scripts/
    seed_admin.py            ← one-time: python -m scripts.seed_admin email@example.com
```

## Environment variables

| Variable                        | Required | Default                         | Description                                       |
| ------------------------------- | -------- | ------------------------------- | ------------------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✓        | `firebase-service-account.json` | Path to downloaded key file                       |
| `GEMINI_API_KEY`                | ✓        | —                               | From https://aistudio.google.com/apikey           |
| `GEMINI_MODEL`                  |          | `gemini-2.5-flash`              | Try `gemini-2.5-flash-lite` for higher rate limit |
| `RISK_THRESHOLD`                |          | `0.7`                           | grief+fear+sadness sum above this → flag          |
| `CORS_ORIGINS`                  |          | `http://localhost:3000`         | Comma-separated allowed frontend origins          |

## Run

```
source venv/bin/activate   # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

- Health check: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs

## Models downloaded automatically (first run only)

| Model                                    | Size    | Used for                                  |
| ---------------------------------------- | ------- | ----------------------------------------- |
| `SamLowe/roberta-base-go_emotions`       | ~500 MB | 28-class emotion analysis on journal text |
| `sentence-transformers/all-MiniLM-L6-v2` | ~90 MB  | Resume-to-JD cosine similarity gap score  |

Both cache locally after the first download. No Hugging Face account or token needed.

## Privacy boundary — how it works

The same Firestore `journal_entries` document is returned through two completely
different Pydantic response models:

- `JournalEntryStudentView` — fields: `id, text, emotions, topEmotion, insight, createdAt`.
  No `riskFlag`, no `riskScore`, no `counsellorSummary`, no `counsellorNotes`.
- `JournalEntryCounsellorView` — all fields including risk data and notes.

FastAPI serialises the response through whichever model the route declares. Fields
not in the model cannot appear in the response regardless of what's in Firestore.

The counsellor routers never reference `analyses` or `resumeTextSnippet` collections.
The student/career routes never reference `counsellorNotes` or `riskScore`.

## Firestore collections

| Collection        | Written by                                 | Read by                                                           |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `users`           | `security.py` (auto-create on first login) | all roles (own doc), admin (all)                                  |
| `journal_entries` | `journal.py`                               | student (own), counsellor (assigned students), admin (count only) |
| `analyses`        | `career.py`                                | student (own), admin (count only)                                 |
