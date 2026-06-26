from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db
from ..schemas import (
    AddNoteRequest,
    CounsellorNote,
    EmotionScores,
    JournalEntryCounsellorView,
    UserOut,
)
from ..security import require_role

router = APIRouter(prefix="/counsellor", tags=["counsellor"])


def _to_counsellor_view(doc_id: str, data: dict) -> JournalEntryCounsellorView:
    return JournalEntryCounsellorView(
        id=doc_id,
        userId=data["userId"],
        text=data["text"],
        emotions=EmotionScores(**data["emotions"]),
        topEmotion=data["topEmotion"],
        riskFlag=data["riskFlag"],
        riskScore=data["riskScore"],
        counsellorSummary=data.get("counsellorSummary"),
        counsellorNotes=[CounsellorNote(**n) for n in data.get("counsellorNotes", [])],
        createdAt=data["createdAt"],
    )


@router.get("/students", response_model=list[UserOut])
async def my_students(user: dict = Depends(require_role("counsellor"))):
    db = get_db()
    docs = db.collection("users").where("counsellorId", "==", user["uid"]).stream()
    return [UserOut(**d.to_dict()) for d in docs]


@router.get("/students/{student_id}/journal", response_model=list[JournalEntryCounsellorView])
async def student_journal(student_id: str, user: dict = Depends(require_role("counsellor"))):
    db = get_db()
    student = db.collection("users").document(student_id).get()
    if not student.exists or student.to_dict().get("counsellorId") != user["uid"]:
        raise HTTPException(403, "This student is not assigned to you")

    docs = (
        db.collection("journal_entries")
        .where("userId", "==", student_id)
        .order_by("createdAt", direction="DESCENDING")
        .stream()
    )
    return [_to_counsellor_view(d.id, d.to_dict()) for d in docs]


@router.post("/entries/{entry_id}/notes")
async def add_note(entry_id: str, payload: AddNoteRequest, user: dict = Depends(require_role("counsellor"))):
    db = get_db()
    ref = db.collection("journal_entries").document(entry_id)
    doc = ref.get()
    if not doc.exists or doc.to_dict().get("counsellorId") != user["uid"]:
        raise HTTPException(403, "Not one of your students' entries")

    note = {
        "note": payload.note,
        "addedBy": user["uid"],
        "addedAt": datetime.now(timezone.utc),
    }
    existing = doc.to_dict().get("counsellorNotes", [])
    ref.update({"counsellorNotes": existing + [note]})
    return {"added": True}


@router.get("/alerts", response_model=list[JournalEntryCounsellorView])
async def alerts(user: dict = Depends(require_role("counsellor"))):
    db = get_db()
    docs = (
        db.collection("journal_entries")
        .where("counsellorId", "==", user["uid"])
        .where("riskFlag", "==", True)
        .order_by("riskScore", direction="DESCENDING")
        .stream()
    )
    return [_to_counsellor_view(d.id, d.to_dict()) for d in docs]
