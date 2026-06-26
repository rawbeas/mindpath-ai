from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as firebase_auth

from ..database import get_db
from ..schemas import UserOut, UserUpdateRequest
from ..security import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    """Call this once after a fresh sign-in to create/fetch your own profile."""
    return UserOut(**user)


@router.patch("/me", response_model=UserOut)
async def update_me(payload: UserUpdateRequest, user: dict = Depends(get_current_user)):
    """Update display name. Email/password changes go through Firebase directly."""
    db = get_db()
    ref = db.collection("users").document(user["uid"])
    updates = {}
    if payload.name is not None:
        name = payload.name.strip()
        if len(name) < 1:
            raise HTTPException(400, "Name cannot be empty.")
        updates["name"] = name
        # keep Firebase Auth display name in sync
        firebase_auth.update_user(user["uid"], display_name=name)
    if not updates:
        raise HTTPException(400, "Nothing to update.")
    ref.update(updates)
    doc = ref.get().to_dict()
    return UserOut(**doc)


@router.delete("/me")
async def delete_me(user: dict = Depends(get_current_user)):
    """
    Deletes the user's Firestore profile and Firebase Auth account.
    Journal entries and analyses are left in place for counsellor/admin
    audit purposes but are now orphaned (userId no longer resolves).
    """
    db = get_db()
    db.collection("users").document(user["uid"]).delete()
    firebase_auth.delete_user(user["uid"])
    return {"deleted": True}