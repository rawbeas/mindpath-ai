from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JournalSubmit(BaseModel):
    text: str


class EmotionScores(BaseModel):
    """All 28 GoEmotions labels. Extra/missing labels are tolerated."""

    admiration: float = 0
    amusement: float = 0
    anger: float = 0
    annoyance: float = 0
    approval: float = 0
    caring: float = 0
    confusion: float = 0
    curiosity: float = 0
    desire: float = 0
    disappointment: float = 0
    disapproval: float = 0
    disgust: float = 0
    embarrassment: float = 0
    excitement: float = 0
    fear: float = 0
    gratitude: float = 0
    grief: float = 0
    joy: float = 0
    love: float = 0
    nervousness: float = 0
    optimism: float = 0
    pride: float = 0
    realization: float = 0
    relief: float = 0
    remorse: float = 0
    sadness: float = 0
    surprise: float = 0
    neutral: float = 0


class JournalEntryStudentView(BaseModel):
    """
    What the student who wrote the entry sees. No riskFlag, no
    riskScore, no counsellorSummary, no counsellorNotes — those
    fields exist on the underlying Firestore document but this
    response model simply never mentions them, so they can't leak
    through this route no matter what.
    """

    id: str
    text: str
    emotions: EmotionScores
    topEmotion: str
    insight: str
    createdAt: datetime


class CounsellorNote(BaseModel):
    note: str
    addedBy: str
    addedAt: datetime


class JournalEntryCounsellorView(BaseModel):
    """What an assigned counsellor sees for one of their students. Full breakdown, risk score, notes."""

    id: str
    userId: str
    text: str
    emotions: EmotionScores
    topEmotion: str
    riskFlag: bool
    riskScore: float
    counsellorSummary: Optional[str] = None
    counsellorNotes: list[CounsellorNote] = []
    createdAt: datetime


class AddNoteRequest(BaseModel):
    note: str


class UserOut(BaseModel):
    uid: str
    email: str
    name: str
    role: str
    counsellorId: Optional[str] = None


class RoleUpdateRequest(BaseModel):
    role: str  # "student" | "counsellor" | "admin"


class AssignCounsellorRequest(BaseModel):
    counsellorId: str


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None


# ── Career pipeline ──────────────────────────────────────────────────────────


class AnalysisResult(BaseModel):
    """
    What the student sees after a resume analysis. Counsellors never
    see this — the privacy wall goes both ways.
    """
    id: str
    jobTitle: str
    companyName: str
    gapScore: int                        # 0-100 cosine similarity
    matchedSkills: list[str]
    missingSkills: list[str]
    rewrittenBullets: list[str]
    interviewQuestions: list[str]
    createdAt: datetime


class AnalysisListItem(BaseModel):
    """Lightweight summary for the career history list."""
    id: str
    jobTitle: str
    companyName: str
    gapScore: int
    createdAt: datetime


class InterviewAnswerRequest(BaseModel):
    analysisId: str    # links back to the analysis so we know which questions to pull
    question: str
    answer: str


class InterviewFeedbackOut(BaseModel):
    question: str
    answer: str
    score: int
    feedback: str
    improved: str