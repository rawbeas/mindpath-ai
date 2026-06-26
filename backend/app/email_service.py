"""
Sends risk-alert emails to counsellors when a student journal entry is
flagged. Uses Python's built-in smtplib — no extra dependency.

Works with any SMTP provider. Gmail is the easiest for local testing:
  host=smtp.gmail.com, port=587, use_ssl=False (STARTTLS)
  password = a 16-character App Password, NOT your normal Gmail password.
  See backend/.env.example for the full setup guide.

If SMTP_USER or SMTP_PASSWORD is empty, the function returns False
immediately and logs a single info line. This means email is opt-in —
the rest of the app works perfectly without it configured.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import settings

logger = logging.getLogger(__name__)


def send_risk_alert(
    counsellor_email: str,
    counsellor_name: str,
    student_name: str,
    risk_score: float,
    top_emotions: list[str],
) -> bool:
    """
    Fires a risk-alert email.
    Returns True on success, False on any failure.
    NEVER raises — a broken SMTP config must not affect journal submissions.
    """
    if not settings.smtp_user or not settings.smtp_password:
        logger.info(
            "SMTP not configured — risk alert email skipped "
            "(set SMTP_USER + SMTP_PASSWORD in .env to enable)"
        )
        return False

    score_pct = round(risk_score * 100)
    threshold_pct = round(settings.risk_threshold * 100)
    emotions_str = ", ".join(top_emotions)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "[MindPath AI] Risk alert — a student may need your attention"
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
        msg["To"] = counsellor_email

        # ── plain text ────────────────────────────────────────────
        plain = (
            f"Hi {counsellor_name},\n\n"
            f"A journal entry from {student_name} has been automatically "
            f"flagged for high distress.\n\n"
            f"  Risk score   : {score_pct}%  (threshold: {threshold_pct}%)\n"
            f"  Top emotions : {emotions_str}\n\n"
            f"Log in to MindPath AI to review the entry and add a note.\n\n"
            f"---\n"
            f"This is an automated alert. The student has not been told "
            f"their entry was flagged."
        )

        # ── HTML ──────────────────────────────────────────────────
        html = f"""<!DOCTYPE html>
<html lang="en">
<body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
             padding:24px;color:#333;background:#fff;">

  <div style="border-left:4px solid #D9614D;padding-left:16px;margin-bottom:24px;">
    <h2 style="margin:0 0 4px 0;color:#D9614D;">Risk alert</h2>
    <p style="margin:0;color:#666;font-size:14px;">
      A student may need your attention
    </p>
  </div>

  <p>Hi {counsellor_name},</p>
  <p>
    A journal entry from <strong>{student_name}</strong> has been
    automatically flagged for high distress.
  </p>

  <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;">
    <tr style="background:#f9f9f9;">
      <td style="padding:10px 14px;border:1px solid #eee;
                 color:#666;width:140px;">Risk score</td>
      <td style="padding:10px 14px;border:1px solid #eee;
                 font-weight:bold;color:#D9614D;">
        {score_pct}%
        <span style="color:#999;font-weight:normal;">
          &nbsp;(threshold {threshold_pct}%)
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #eee;color:#666;">
        Top emotions
      </td>
      <td style="padding:10px 14px;border:1px solid #eee;">
        {emotions_str}
      </td>
    </tr>
  </table>

  <p>
    <a href="http://localhost:3000/counsellor/dashboard"
       style="display:inline-block;padding:10px 22px;
              background:#5FA39B;color:#fff;text-decoration:none;
              border-radius:6px;font-size:14px;">
      Review in MindPath AI →
    </a>
  </p>

  <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
  <p style="font-size:12px;color:#aaa;">
    This is an automated alert from MindPath AI.<br>
    The student has <strong>not</strong> been told their entry was flagged.
  </p>
</body>
</html>"""

        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        # ── send ──────────────────────────────────────────────────
        if settings.smtp_use_ssl:
            # port 465 — direct SSL (less common)
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as srv:
                srv.login(settings.smtp_user, settings.smtp_password)
                srv.sendmail(settings.smtp_user, counsellor_email, msg.as_string())
        else:
            # port 587 — STARTTLS (Gmail default, most providers)
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as srv:
                srv.ehlo()
                srv.starttls()
                srv.login(settings.smtp_user, settings.smtp_password)
                srv.sendmail(settings.smtp_user, counsellor_email, msg.as_string())

        logger.info("Risk alert email sent to %s", counsellor_email)
        return True

    except Exception as exc:  # noqa: BLE001
        logger.error("Risk alert email failed: %s", exc)
        return False