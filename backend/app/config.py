from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All values are read from a .env file in the backend/ folder
    (see .env.example) or from real environment variables — never
    hardcode secrets here.
    """

    firebase_service_account_path: str = "firebase-service-account.json"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # grief + fear + sadness above this score trips a counsellor alert
    risk_threshold: float = 0.7

    # comma-separated list of frontend origins allowed to call this API
    cors_origins: str = "http://localhost:3000"

    # ── Email / SMTP (optional) ───────────────────────────────────
    # Leave smtp_user and smtp_password empty to disable email alerts.
    # When disabled the app works normally — alerts just appear in the
    # counsellor dashboard instead of being pushed to their inbox.
    #
    # Gmail setup (recommended for local testing):
    #   smtp_host     = smtp.gmail.com
    #   smtp_port     = 587
    #   smtp_use_ssl  = False   (587 uses STARTTLS, not direct SSL)
    #   smtp_user     = your Gmail address
    #   smtp_password = a 16-character App Password from
    #                   https://myaccount.google.com/apppasswords
    #                   (requires 2-Step Verification to be on)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_use_ssl: bool = False
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "MindPath AI"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()