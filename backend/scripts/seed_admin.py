"""
One-time bootstrap: promote an existing Firebase Auth user to admin.

The user must already exist in Firebase Auth (sign up via the REST
API trick in the README, or the Firebase console) and should have
called GET /users/me at least once so their Firestore profile exists
- though this script will create the profile itself if it doesn't.

Usage (from the backend/ folder):
    python -m scripts.seed_admin someone@example.com
"""
import sys

from firebase_admin import auth as firebase_auth

from app.database import init_firebase


def main(email: str) -> None:
    db = init_firebase()
    user_record = firebase_auth.get_user_by_email(email)
    uid = user_record.uid

    ref = db.collection("users").document(uid)
    if ref.get().exists:
        ref.update({"role": "admin"})
    else:
        ref.set(
            {
                "uid": uid,
                "email": email,
                "name": user_record.display_name or email,
                "role": "admin",
                "counsellorId": None,
            }
        )

    print(f"{email} ({uid}) is now an admin.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.seed_admin <email>")
        sys.exit(1)
    main(sys.argv[1])
