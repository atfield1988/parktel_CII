# backend/app/routers/renew-notices.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_admin_user, get_current_user

router = APIRouter(
    prefix="/notices",
    tags=["notices"],
)

@router.post("/", response_model=schemas.Notice)
def create_notice(
    notice: schemas.NoticeCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    db_notice = models.Notice(**notice.dict())
    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    return db_notice

@router.get("/", response_model=List[schemas.Notice])
def get_notices(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notices = db.query(models.Notice).order_by(
        models.Notice.is_pinned.desc(),
        models.Notice.created_at.desc()
    ).offset(skip).limit(limit).all()
    return notices

@router.get("/{notice_id}", response_model=schemas.Notice)
def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    notice.view_count += 1
    db.add(notice)
    db.commit()
    db.refresh(notice)

    return notice

@router.put("/{notice_id}", response_model=schemas.Notice)
def update_notice(
    notice_id: int,
    notice: schemas.NoticeUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    db_notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not db_notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    for key, value in notice.dict().items():
        setattr(db_notice, key, value)

    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    return db_notice

@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    db_notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not db_notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    db.delete(db_notice)
    db.commit()
    return {"ok": True}
