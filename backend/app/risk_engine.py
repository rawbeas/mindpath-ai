"""
Deliberately simple and auditable: sum a handful of distress-coded
emotions and flag if the total crosses a threshold. A counsellor can
see exactly why something got flagged instead of trusting a black-box
classifier — and the threshold lives in one place (.env) if it ever
needs tuning once you see real data.
"""
from .config import settings

DISTRESS_EMOTIONS = ("grief", "fear", "sadness")


def assess(emotions: dict[str, float]) -> tuple[bool, float, str]:
    """Returns (riskFlag, riskScore, topEmotion)."""
    risk_score = round(sum(emotions.get(e, 0.0) for e in DISTRESS_EMOTIONS), 4)
    flag = risk_score > settings.risk_threshold
    top_emotion = max(emotions, key=emotions.get) if emotions else "neutral"
    return flag, risk_score, top_emotion
