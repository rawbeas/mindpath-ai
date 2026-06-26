import json
import os

import firebase_admin
from firebase_admin import credentials, firestore

from .config import settings

_app = None
_db = None


def init_firebase():
    """
    Called once on FastAPI startup. Safe to call more than once.

    Supports two modes:
      Local dev  : reads from a JSON file (firebase-service-account.json)
      Cloud deploy: reads the JSON content from FIREBASE_SERVICE_ACCOUNT_JSON
                    env var (set this in Render/Railway dashboard — paste the
                    entire content of the JSON file as the variable value)
    """
    global _app, _db
    if _app is None:
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        if sa_json:
            try:
                cred = credentials.Certificate(json.loads(sa_json))
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. "
                    "Make sure you pasted the entire contents of the service account "
                    f"file, not just the path to it. Original error: {exc}"
                ) from exc
        else:
            cred = credentials.Certificate(settings.firebase_service_account_path)

        _app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db


def get_db():
    if _db is None:
        return init_firebase()
    return _db