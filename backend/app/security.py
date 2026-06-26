import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from .database import get_db

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = creds.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        logger.warning("Token verification failed: token expired")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token expired — please sign in again.")
    except firebase_auth.InvalidIdTokenError as exc:
        logger.warning("Token verification failed: invalid token — %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Invalid token: {exc}")
    except firebase_auth.CertificateFetchError as exc:
        logger.error("Token verification failed: can't reach Google servers — %s", exc)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Auth service temporarily unavailable — retry in a moment.")
    except ValueError as exc:
        # Most commonly: project ID mismatch between frontend Firebase project
        # and the service account JSON the backend loaded.
        logger.error("Token verification failed: ValueError — %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Token rejected — likely a Firebase project ID mismatch: {exc}")
    except Exception as exc:
        logger.error("Token verification failed: %s — %s", type(exc).__name__, exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Auth error ({type(exc).__name__}): {exc}")

    uid = decoded["uid"]
    db = get_db()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        profile = {
            "uid": uid,
            "email": decoded.get("email", ""),
            "name": decoded.get("name", decoded.get("email", "")),
            "role": "student",
            "counsellorId": None,
        }
        user_ref.set(profile)
        return profile

    return user_doc.to_dict()


def require_role(*roles: str):
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires role: {' or '.join(roles)}",
            )
        return user
    return _check