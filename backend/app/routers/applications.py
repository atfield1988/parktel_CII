# backend/app/routers/applications.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user, get_current_admin_user

router = APIRouter(
    prefix="/applications",
    tags=["applications"],
)

@router.post("/", response_model=schemas.Application)
def create_application(
    application: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """(User) 스케줄 신청 - 동시성 제어 포함"""
    try:
        schedule = db.query(models.Schedule).filter(
            models.Schedule.id == application.schedule_id
        ).with_for_update().first()

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")

        # 중복 신청 확인
        existing = db.query(models.Application).filter(
            models.Application.user_id == current_user.id,
            models.Application.schedule_id == application.schedule_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 신청한 스케줄입니다.")

        # 정원 확인
        active_count = db.query(models.Application).filter(
            models.Application.schedule_id == application.schedule_id,
            models.Application.status.in_([models.ApplicationStatusEnum.pending, models.ApplicationStatusEnum.approved])
        ).count()

        if active_count >= schedule.capacity:
            raise HTTPException(status_code=400, detail="근무 인원이 초과되었습니다.")

        # 신청서 생성
        new_app = models.Application(
            user_id=current_user.id,
            schedule_id=application.schedule_id,
            status=models.ApplicationStatusEnum.pending
        )
        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        return new_app

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """(User) 본인의 신청 취소 - pending 상태만 가능"""
    try:
        application = db.query(models.Application).filter(
            models.Application.id == application_id
        ).first()
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        if application.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # pending 상태만 취소 가능
        if application.status != models.ApplicationStatusEnum.pending:
            raise HTTPException(status_code=400, detail="승인된 신청은 취소할 수 없습니다.")

        db.delete(application)
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/schedule/{schedule_id}", response_model=List[schemas.Application])
def get_applications_for_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """(Admin+) 스케줄별 신청자 목록 (신청 시간순)"""
    apps = db.query(models.Application).filter(
        models.Application.schedule_id == schedule_id
    ).options(
        joinedload(models.Application.user)
    ).order_by(
        models.Application.created_at.asc()
    ).all()
    return apps
