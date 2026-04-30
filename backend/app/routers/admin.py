# backend/app/routers/renew-admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from .. import models, schemas, security
from ..database import get_db
from ..dependencies import get_current_admin_user, get_current_super_admin_user

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

@router.get("/users", response_model=List[schemas.User])
def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/pending-users", response_model=List[schemas.User])
def get_pending_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    users = db.query(models.User).filter(models.User.status == models.UserStatusEnum.pending).all()
    return users

@router.post("/approve-user", response_model=schemas.User)
def approve_user(
    approval: schemas.UserApproval,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    user = db.query(models.User).filter(models.User.id == approval.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = approval.status
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/grant-admin", response_model=schemas.User)
def grant_admin_privilege(
    grant_data: schemas.GrantAdmin,
    db: Session = Depends(get_db),
    current_super_admin: models.User = Depends(get_current_super_admin_user)
):
    user = db.query(models.User).filter(models.User.id == grant_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_admin = db.query(models.User).filter(models.User.username == grant_data.username).first()
    if existing_admin and existing_admin.id != user.id:
        raise HTTPException(status_code=400, detail="Username already taken")

    user.role = models.UserRoleEnum.admin
    user.username = grant_data.username
    user.hashed_password = security.get_password_hash("banquet88!")
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/applications/update-status", response_model=schemas.Application)
def update_application_status(
    approval: schemas.ApplicationApproval,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    try:
        application = db.query(models.Application).filter(
            models.Application.id == approval.application_id
        ).options(
            joinedload(models.Application.schedule)
        ).first()

        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        schedule = application.schedule 
        db.refresh(schedule)

        if not schedule:
             raise HTTPException(status_code=404, detail="Schedule not found")

        original_status = application.status
        new_status = approval.new_status

        if original_status == new_status:
            return application

        if new_status == models.ApplicationStatusEnum.approved:
            if schedule.current_applicants >= schedule.capacity:
                raise HTTPException(status_code=400, detail="정원이 초과되었습니다.")
            schedule.current_applicants += 1
            application.status = new_status

        elif original_status == models.ApplicationStatusEnum.approved and new_status != models.ApplicationStatusEnum.approved:
            if schedule.current_applicants > 0:
                schedule.current_applicants -= 1
            application.status = new_status

        else:
            application.status = new_status

        db.add(application)
        db.add(schedule)
        db.commit()
        db.refresh(application)
        return application

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
