# backend/app/routers/schedules.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_admin_user

router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
)

@router.post("/", response_model=schemas.Schedule)
def create_schedule(
    schedule: schemas.ScheduleCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """(Admin+) 스케줄(채용공고) 생성"""
    db_schedule = models.Schedule(**schedule.dict())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.get("/", response_model=List[schemas.ScheduleWithPendingCount])
def get_schedules(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """(Public) 모든 스케줄 조회 - 로그인 불필요"""
    
    # Pending 신청자 수 서브쿼리
    pending_subquery = db.query(
            models.Application.schedule_id,
            func.count(models.Application.id).label("pending_count")
        ).filter(
            models.Application.status == models.ApplicationStatusEnum.pending
        ).group_by(
            models.Application.schedule_id
        ).subquery()

    # Schedule과 서브쿼리 조인
    results = db.query(
            models.Schedule,
            func.coalesce(pending_subquery.c.pending_count, 0).label("pending_applicants")
        ).outerjoin(
            pending_subquery,
            models.Schedule.id == pending_subquery.c.schedule_id
        ).order_by(
            models.Schedule.work_date.asc()
        ).offset(skip).limit(limit).all()

    # Pydantic 스키마로 변환
    schedules_with_counts = []
    for schedule, pending_count in results:
        schedule_data = schemas.ScheduleWithPendingCount.from_orm(schedule)
        schedule_data.pending_applicants = pending_count
        schedules_with_counts.append(schedule_data)
        
    return schedules_with_counts

@router.get("/{schedule_id}", response_model=schemas.ScheduleWithPendingCount)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db)
):
    """(Public) 특정 스케줄 상세 조회 - 로그인 불필요"""
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Pending 신청자 수 계산
    pending_count = db.query(models.Application).filter(
        models.Application.schedule_id == schedule_id,
        models.Application.status == models.ApplicationStatusEnum.pending
    ).count()
    
    schedule_data = schemas.ScheduleWithPendingCount.from_orm(schedule)
    schedule_data.pending_applicants = pending_count

    return schedule_data

@router.put("/{schedule_id}", response_model=schemas.Schedule)
def update_schedule(
    schedule_id: int,
    schedule_update: schemas.ScheduleUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """(Admin+) 스케줄 수정"""
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # 신청자가 있으면 정원 수정 불가
    applicant_count = db.query(models.Application).filter(
        models.Application.schedule_id == schedule_id,
        models.Application.status.in_([models.ApplicationStatusEnum.pending, models.ApplicationStatusEnum.approved])
    ).count()
    
    if applicant_count > 0 and schedule_update.capacity != db_schedule.capacity:
         raise HTTPException(status_code=400, detail="신청자가 있는 스케줄의 정원은 변경할 수 없습니다.")

    for key, value in schedule_update.dict().items():
        setattr(db_schedule, key, value)
        
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """(Admin+) 스케줄 삭제 (CASCADE로 관련 신청서 자동 삭제)"""
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # CASCADE 설정으로 관련 Applications 자동 삭제
    db.delete(db_schedule)
    db.commit()
    return {"ok": True}
