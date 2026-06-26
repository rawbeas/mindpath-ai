from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from .. import emotion_model, llm_client, risk_engine
from ..database import get_db
from ..email_service import send_risk_alert
from ..schemas import EmotionScores, JournalEntryStudentView, JournalSubmit
from ..security import get_current_user

router = APIRouter(prefix="/journal", tags=["journal"])


def _alert_counsellor(
    counsellor_id: str,
    student_name: str,
    risk_score: float,
    emotions: dict,
) -> None:
    """
    Background task — looks up the counsellor's email from Firestore then
    fires the alert email. Runs after the HTTP response is already sent,
    so a slow or broken SMTP server never delays the student's submission.
    Never raises.
    """
    try:
        db = get_db()
        doc = db.collection("users").document(counsellor_id).get()
        if not doc.exists:
            return
        counsellor = doc.to_dict()
        top3 = sorted(emotions, key=emotions.get, reverse=True)[:3]
        send_risk_alert(
            counsellor_email=counsellor["email"],
            counsellor_name=counsellor.get("name", "Counsellor"),
            student_name=student_name,
            risk_score=risk_score,
            top_emotions=top3,
        )
    except Exception:  # noqa: BLE001
        pass  # already logged inside send_risk_alert


@router.post("/submit", response_model=JournalEntryStudentView)
async def submit_entry(
    payload: JournalSubmit,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    text = payload.text.strip()
    if not (10 <= len(text) <= 4000):
        raise HTTPException(
            400,
            "Entry should be a short paragraph (at least a few words, under ~4000 characters).",
        )

    emotions = emotion_model.analyze(text)
    flag, risk_score, top_emotion = risk_engine.assess(emotions)

    summary = None
    if flag:
        top5 = sorted(emotions, key=emotions.get, reverse=True)[:5]
        summary = llm_client.summarize_for_counsellor(text, top5)

    db = get_db()
    doc_ref = db.collection("journal_entries").document()
    created_at = datetime.now(timezone.utc)
    entry = {
        "userId": user["uid"],
        "text": text,
        "emotions": emotions,
        "topEmotion": top_emotion,
        "riskFlag": flag,
        "riskScore": risk_score,
        "counsellorSummary": summary,
        "counsellorId": user.get("counsellorId"),
        "counsellorNotes": [],
        "createdAt": created_at,
    }
    doc_ref.set(entry)

    # Fire-and-forget email alert — only when flagged AND counsellor assigned.
    # Runs after the response is sent; never blocks or fails the submission.
    if flag and user.get("counsellorId"):
        background_tasks.add_task(
            _alert_counsellor,
            counsellor_id=user["counsellorId"],
            student_name=user.get("name", "A student"),
            risk_score=risk_score,
            emotions=emotions,
        )

    return JournalEntryStudentView(
        id=doc_ref.id,
        text=text,
        emotions=EmotionScores(**emotions),
        topEmotion=top_emotion,
        insight=llm_client.quick_insight(top_emotion),
        createdAt=created_at,
    )


@router.get("/history", response_model=list[JournalEntryStudentView])
async def my_history(user: dict = Depends(get_current_user)):
    db = get_db()
    docs = (
        db.collection("journal_entries")
        .where("userId", "==", user["uid"])
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    out = []
    for d in docs:
        data = d.to_dict()
        out.append(
            JournalEntryStudentView(
                id=d.id,
                text=data["text"],
                emotions=EmotionScores(**data["emotions"]),
                topEmotion=data["topEmotion"],
                insight=llm_client.quick_insight(data["topEmotion"]),
                createdAt=data["createdAt"],
            )
        )
    return out


@router.delete("/{entry_id}")
async def delete_entry(entry_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    ref = db.collection("journal_entries").document(entry_id)
    doc = ref.get()
    if not doc.exists or doc.to_dict().get("userId") != user["uid"]:
        raise HTTPException(404, "Entry not found")
    ref.delete()
    return {"deleted": True}