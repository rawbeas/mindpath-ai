"""
Thin wrapper around an OpenAI-compatible chat endpoint. Default
provider is Gemini (genuinely free tier, no card needed, ~1,500
requests/day on Flash models as of mid-2026). One thing worth
knowing: Google's free tier may use these prompts to improve their
models - worth keeping in mind given this carries journal text.

Swapping providers later is a base_url + api_key change, nothing
else, because Gemini, Groq, and a local Ollama server all speak the
same OpenAI-style chat-completions API:
  - Groq:    base_url="https://api.groq.com/openai/v1"
  - Ollama:  base_url="http://localhost:11434/v1", api_key="ollama" (unused but required)
"""
import json
import logging
import re

from openai import OpenAI

from .config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=settings.gemini_api_key,
        )
    return _client


def _parse_json_response(raw: str) -> dict:
    """
    Robustly extracts a JSON object from a Gemini response.

    Handles all common Gemini formatting quirks:
      - ```json ... ``` fences
      - ``` ... ``` fences without a language tag
      - Raw JSON with no fences at all
      - Leading/trailing whitespace or newlines
      - Responses where the JSON is embedded in surrounding prose
    """
    raw = raw.strip()

    # ── 1. Strip markdown code fences if present ──────────────────
    fence = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', raw, re.DOTALL | re.IGNORECASE)
    if fence:
        raw = fence.group(1).strip()

    # ── 2. Try direct parse ───────────────────────────────────────
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # ── 3. Fallback: find outermost { ... } in the string ─────────
    start = raw.find('{')
    end = raw.rfind('}')
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end + 1])
        except json.JSONDecodeError:
            pass

    # ── 4. Give up with a useful error ────────────────────────────
    preview = raw[:400]
    raise ValueError(
        f"Could not parse JSON from Gemini response. "
        f"First 400 chars received:\n{preview}"
    )


def summarize_for_counsellor(journal_text: str, top_emotions: list[str]) -> str:
    """Only called when an entry crosses the risk threshold — keeps LLM calls to the cases that need them."""
    client = _get_client()
    prompt = (
        "You are assisting a student counsellor, not the student. Below is "
        "a student's private journal entry and its top detected emotions. "
        "Write a 2-3 sentence clinical-style note for the counsellor: what "
        "the student seems to be going through, and one concrete next "
        "step. Do not address the student directly.\n\n"
        f"Top detected emotions: {', '.join(top_emotions)}\n\n"
        f"Journal entry:\n{journal_text}"
    )
    response = client.chat.completions.create(
        model=settings.gemini_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def analyze_resume(resume_text: str, job_description: str, score: int) -> dict:
    """
    One combined Gemini call that returns:
      - matched_skills      : skills the resume already shows
      - missing_skills      : skills the job wants but the resume lacks
      - rewritten_bullets   : 4-6 stronger bullet points rewritten for the role
      - interview_questions : 10 likely interview questions for this exact JD
    Returns a dict. Raises ValueError with details if Gemini's JSON can't be parsed.
    """
    client = _get_client()
    prompt = f"""You are an expert career coach helping a student tailor their resume
for a specific job. Analyse the resume against the job description and return
ONLY a valid JSON object with exactly these four keys:

  "matched_skills"       - array of strings: skills visible in the resume that the JD asks for
  "missing_skills"       - array of strings: skills the JD asks for that are absent from the resume
  "rewritten_bullets"    - array of 4 to 6 strings: stronger bullet points rewriting the
                           weakest lines from the resume to better fit this role
  "interview_questions"  - array of exactly 10 strings: likely interview questions for this role

The overall match score is {score}/100. Use that context when framing the feedback.
Return NO prose, NO markdown, NO code fences. Start your response with {{ and end with }}.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}"""

    response = client.chat.completions.create(
        model=settings.gemini_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=8192,
    )
    raw = response.choices[0].message.content
    logger.debug("Gemini raw response (first 500 chars): %s", raw[:500])
    return _parse_json_response(raw)


def interview_feedback(question: str, answer: str) -> dict:
    """
    Evaluates one mock interview answer and returns:
      - score    : int 0-100
      - feedback : 2-3 sentence constructive critique
      - improved : one improved version of the answer
    """
    client = _get_client()
    prompt = f"""You are a senior interviewer giving honest, constructive feedback
on a student's mock interview answer. Return ONLY a valid JSON object with exactly:

  "score"    - integer 0-100 rating the answer quality
  "feedback" - string: 2-3 sentence critique (what worked, what did not)
  "improved" - string: one improved version of the answer the student could use

Return NO prose, NO markdown, NO code fences. Start your response with {{ and end with }}.

QUESTION: {question}
ANSWER: {answer}"""

    response = client.chat.completions.create(
        model=settings.gemini_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=4096,
    )
    raw = response.choices[0].message.content
    logger.debug("Gemini interview raw response: %s", raw[:300])
    return _parse_json_response(raw)


def quick_insight(top_emotion: str) -> str:
    """
    Rule-based, instant, zero LLM calls — this is what the student sees
    about their own entry. No need to spend an LLM call on something a
    lookup table does just as well.
    """
    phrasing = {
        "joy":         "You seem to be in good spirits today.",
        "amusement":   "You seem to be in good spirits today.",
        "sadness":     "You seem to be carrying something heavy today.",
        "fear":        "You seem anxious or on edge today.",
        "nervousness": "You seem anxious or on edge today.",
        "grief":       "It sounds like you're processing something difficult.",
        "anger":       "You seem frustrated today.",
        "annoyance":   "You seem frustrated today.",
        "gratitude":   "You seem to be feeling thankful today.",
        "neutral":     "Your entry reads fairly even today.",
    }
    return phrasing.get(top_emotion, f"Today's entry reads mostly as {top_emotion}.")