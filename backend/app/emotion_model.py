"""
Loads SamLowe/roberta-base-go_emotions once (lazily, on first use) and
exposes a single analyze() function. This runs entirely inside this
process — no API key, no network call, no per-request cost. Journal
text never leaves this machine.
"""
from transformers import pipeline

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            top_k=None,
        )
    return _classifier


def analyze(text: str) -> dict[str, float]:
    """Returns {emotion_label: score} for all 28 GoEmotions labels."""
    classifier = _get_classifier()
    # wrap in a list so the pipeline's output nesting is unambiguous:
    # one outer list per input item, each item a list of 28 label dicts.
    results = classifier([text], truncation=True)[0]
    return {item["label"]: round(item["score"], 4) for item in results}
