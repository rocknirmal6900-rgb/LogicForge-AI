from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.bookmark import Bookmark

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])

class BookmarkCreate(BaseModel):
    item_type: str  # lesson, problem, chat
    item_id: str
    title: str
    subtitle: str = ""
    language: str = "python"

@router.get("/")
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return [
        {
            "id": b.id,
            "item_type": b.item_type,
            "target_id": b.item_id,
            "title": b.title,
            "subtitle": b.subtitle,
            "language": b.language,
            "created_at": b.created_at.isoformat(),
        }
        for b in bookmarks
    ]

@router.post("/")
def create_bookmark(
    data: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == current_user.id,
            Bookmark.item_type == data.item_type,
            Bookmark.item_id == data.item_id,
        )
        .first()
    )
    if existing:
        return {"message": "Already bookmarked", "id": existing.id}

    bm = Bookmark(
        user_id=current_user.id,
        item_type=data.item_type,
        item_id=data.item_id,
        title=data.title,
        subtitle=data.subtitle,
        language=data.language,
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)
    return {"message": "Bookmark created", "id": bm.id}

@router.delete("/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bm = (
        db.query(Bookmark)
        .filter(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id)
        .first()
    )
    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found.")

    db.delete(bm)
    db.commit()
    return {"message": "Bookmark removed", "id": bookmark_id}
