# backend/app/routers/renew-mypage.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user, get_current_admin_user

router = APIRouter(
    prefix="/mypage",
    tags=["mypage"],
)

@router.get("/me", response_model=schemas.User)
def get_my_info(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@router.get("/my-applications", response_model=List[schemas.Application])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    applications = db.query(models.Application).filter(
        models.Application.user_id == current_user.id
    ).options(
        joinedload(models.Application.schedule)
    ).order_by(
        models.Application.created_at.desc()
    ).all()

    return applications

@router.get("/schedule-approved/{schedule_id}")
def get_approved_applicants_for_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    approved_apps = db.query(models.Application).filter(
        models.Application.schedule_id == schedule_id,
        models.Application.status == models.ApplicationStatusEnum.approved
    ).options(
        joinedload(models.Application.user)
    ).order_by(models.Application.created_at.asc()).all()

    if current_user.role not in [models.UserRoleEnum.admin, models.UserRoleEnum.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자 권한이 필요합니다.")

    result = [{
        "application_id": app.id,
        "user_id": app.user.id,
        "phone_number_masked": f"***-****-{app.user.phone_number[-4:]}",
        "username": app.user.username
    } for app in approved_apps]

    return result
