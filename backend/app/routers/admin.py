from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db
from ..schemas import AssignCounsellorRequest, RoleUpdateRequest, UserOut
from ..security import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_ROLES = ("student", "counsellor", "admin")


@router.get("/users", response_model=list[UserOut])
async def list_users(user: dict = Depends(require_role("admin"))):
    db = get_db()
    return [UserOut(**d.to_dict()) for d in db.collection("users").stream()]


@router.patch("/users/{uid}/role")
async def set_role(uid: str, payload: RoleUpdateRequest, user: dict = Depends(require_role("admin"))):
    if payload.role not in VALID_ROLES:
        raise HTTPException(400, f"role must be one of {VALID_ROLES}")
    db = get_db()
    ref = db.collection("users").document(uid)
    if not ref.get().exists:
        raise HTTPException(404, "No such user - have they hit GET /users/me at least once?")
    ref.update({"role": payload.role})
    return {"updated": True}


@router.patch("/users/{uid}/assign-counsellor")
async def assign_counsellor(
    uid: str, payload: AssignCounsellorRequest, user: dict = Depends(require_role("admin"))
):
    db = get_db()
    student_ref = db.collection("users").document(uid)
    if not student_ref.get().exists:
        raise HTTPException(404, "No such student")

    counsellor_doc = db.collection("users").document(payload.counsellorId).get()
    if not counsellor_doc.exists or counsellor_doc.to_dict().get("role") != "counsellor":
        raise HTTPException(400, "counsellorId must belong to a user whose role is already 'counsellor'")

    student_ref.update({"counsellorId": payload.counsellorId})
    return {"assigned": True}


@router.get("/stats")
async def platform_stats(user: dict = Depends(require_role("admin"))):
    """
    Aggregate numbers for the admin dashboard overview.
    No individual names or content — counts only.
    """
    db = get_db()

    users = [d.to_dict() for d in db.collection("users").stream()]
    role_counts = Counter(u.get("role", "student") for u in users)

    journal_docs = list(db.collection("journal_entries").stream())
    flagged = sum(1 for d in journal_docs if d.to_dict().get("riskFlag"))

    analyses = list(db.collection("analyses").stream())

    # counsellor load: how many students each counsellor has
    load: dict[str, int] = defaultdict(int)
    for u in users:
        cid = u.get("counsellorId")
        if cid:
            load[cid] += 1
    avg_load = round(sum(load.values()) / len(load), 1) if load else 0

    return {
        "totalUsers": len(users),
        "students": role_counts.get("student", 0),
        "counsellors": role_counts.get("counsellor", 0),
        "admins": role_counts.get("admin", 0),
        "totalJournalEntries": len(journal_docs),
        "flaggedEntries": flagged,
        "totalAnalyses": len(analyses),
        "avgCounsellorLoad": avg_load,
    }


@router.get("/analytics")
async def platform_analytics(user: dict = Depends(require_role("admin"))):
    """
    Aggregate analytics — no names, no individual content.
    Returns data shaped for recharts on the frontend.
    """
    db = get_db()

    # ── emotion trends ─────────────────────────────────────────────
    TOP_EMOTIONS = ["joy", "sadness", "fear", "anxiety", "grief",
                    "anger", "nervousness", "neutral", "gratitude", "excitement"]
    emotion_totals: dict[str, float] = defaultdict(float)
    journal_count = 0

    for doc in db.collection("journal_entries").stream():
        data = doc.to_dict()
        emotions = data.get("emotions", {})
        for e in TOP_EMOTIONS:
            emotion_totals[e] += emotions.get(e, 0)
        journal_count += 1

    emotion_chart = [
        {"emotion": e, "avgScore": round(emotion_totals[e] / journal_count, 3) if journal_count else 0}
        for e in TOP_EMOTIONS
    ]

    # ── gap score distribution ─────────────────────────────────────
    buckets = {"0-29": 0, "30-49": 0, "50-69": 0, "70-84": 0, "85-100": 0}
    for doc in db.collection("analyses").stream():
        score = doc.to_dict().get("gapScore", 0)
        if score < 30:
            buckets["0-29"] += 1
        elif score < 50:
            buckets["30-49"] += 1
        elif score < 70:
            buckets["50-69"] += 1
        elif score < 85:
            buckets["70-84"] += 1
        else:
            buckets["85-100"] += 1

    gap_chart = [{"range": k, "count": v} for k, v in buckets.items()]

    return {
        "journalCount": journal_count,
        "emotionTrends": emotion_chart,
        "gapScoreDistribution": gap_chart,
    }