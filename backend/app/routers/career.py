import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from .. import embeddings, llm_client
from ..database import get_db
from ..resume_parser import extract_text
from ..schemas import (
    AnalysisListItem,
    AnalysisResult,
    InterviewAnswerRequest,
    InterviewFeedbackOut,
)
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career", tags=["career"])

MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: str = Form(...),
    company_name: str = Form(...),
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "student":
        raise HTTPException(403, "Only students can run resume analyses.")

    # ── 1. Validate and read the PDF ─────────────────────────────
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Upload a PDF file.")
    pdf_bytes = await resume.read()
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(400, "PDF must be under 5 MB.")

    try:
        resume_text = extract_text(pdf_bytes)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    jd = job_description.strip()
    if len(jd) < 50:
        raise HTTPException(400, "Paste the full job description (at least a sentence or two).")

    # ── 2. Local embedding gap score (runs on-device, always fast) ─
    score = embeddings.gap_score(resume_text, jd)

    # ── 3. Gemini: skills, bullets, interview questions ───────────
    try:
        analysis = llm_client.analyze_resume(resume_text, jd, score)
    except Exception as exc:
        # Log the FULL error so it appears in the uvicorn terminal
        logger.error("analyze_resume Gemini call failed: %s", exc, exc_info=True)
        raise HTTPException(
            502,
            f"AI analysis failed — {type(exc).__name__}: {exc}. "
            f"Check the backend terminal for details."
        )

    # ── 4. Persist to Firestore (no PDF stored) ───────────────────
    db = get_db()
    doc_ref = db.collection("analyses").document()
    created_at = datetime.now(timezone.utc)
    record = {
        "userId": user["uid"],
        "jobTitle": job_title.strip(),
        "companyName": company_name.strip(),
        "gapScore": score,
        "resumeTextSnippet": resume_text[:500],
        "matchedSkills":       analysis.get("matched_skills", []),
        "missingSkills":       analysis.get("missing_skills", []),
        "rewrittenBullets":    analysis.get("rewritten_bullets", []),
        "interviewQuestions":  analysis.get("interview_questions", []),
        "createdAt": created_at,
    }
    doc_ref.set(record)

    return AnalysisResult(
        id=doc_ref.id,
        jobTitle=record["jobTitle"],
        companyName=record["companyName"],
        gapScore=score,
        matchedSkills=record["matchedSkills"],
        missingSkills=record["missingSkills"],
        rewrittenBullets=record["rewrittenBullets"],
        interviewQuestions=record["interviewQuestions"],
        createdAt=created_at,
    )


@router.get("/history", response_model=list[AnalysisListItem])
async def history(user: dict = Depends(get_current_user)):
    if user.get("role") != "student":
        raise HTTPException(403, "Only students have a career history.")
    db = get_db()
    docs = (
        db.collection("analyses")
        .where("userId", "==", user["uid"])
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    return [
        AnalysisListItem(
            id=d.id,
            jobTitle=d.to_dict()["jobTitle"],
            companyName=d.to_dict()["companyName"],
            gapScore=d.to_dict()["gapScore"],
            createdAt=d.to_dict()["createdAt"],
        )
        for d in docs
    ]


@router.get("/results/{analysis_id}", response_model=AnalysisResult)
async def get_result(analysis_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("analyses").document(analysis_id).get()
    if not doc.exists:
        raise HTTPException(404, "Analysis not found.")
    data = doc.to_dict()
    if data["userId"] != user["uid"]:
        raise HTTPException(403, "Not your analysis.")
    return AnalysisResult(
        id=doc.id,
        jobTitle=data["jobTitle"],
        companyName=data["companyName"],
        gapScore=data["gapScore"],
        matchedSkills=data["matchedSkills"],
        missingSkills=data["missingSkills"],
        rewrittenBullets=data["rewrittenBullets"],
        interviewQuestions=data["interviewQuestions"],
        createdAt=data["createdAt"],
    )


@router.post("/interview/feedback", response_model=InterviewFeedbackOut)
async def interview_feedback(
    payload: InterviewAnswerRequest,
    user: dict = Depends(get_current_user),
):
    if user.get("role") != "student":
        raise HTTPException(403, "Only students can use the mock interview.")

    answer = payload.answer.strip()
    if len(answer) < 20:
        raise HTTPException(400, "Write a proper answer before asking for feedback.")

    try:
        result = llm_client.interview_feedback(payload.question, answer)
    except Exception as exc:
        logger.error("interview_feedback Gemini call failed: %s", exc, exc_info=True)
        raise HTTPException(
            502,
            f"AI feedback failed — {type(exc).__name__}: {exc}"
        )

    return InterviewFeedbackOut(
        question=payload.question,
        answer=answer,
        score=int(result.get("score", 0)),
        feedback=result.get("feedback", ""),
        improved=result.get("improved", ""),
    )