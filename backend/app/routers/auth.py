from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import time

from .. import models, schemas, security
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

LOGIN_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("LOGIN_RATE_LIMIT_WINDOW_SECONDS", "60"))
LOGIN_RATE_LIMIT_MAX_ATTEMPTS = int(os.getenv("LOGIN_RATE_LIMIT_MAX_ATTEMPTS", "5"))
_login_attempt_store = {}


def _enforce_rate_limit(key: str):
    now = time.time()
    attempts = _login_attempt_store.get(key, [])
    attempts = [t for t in attempts if now - t <= LOGIN_RATE_LIMIT_WINDOW_SECONDS]

    if len(attempts) >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        )

    attempts.append(now)
    _login_attempt_store[key] = attempts


def _clear_rate_limit(key: str):
    _login_attempt_store.pop(key, None)


@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """(User) 회원가입 신청. 상태 'pending', 사용자 입력 비밀번호 해시 저장"""
    db_user = db.query(models.User).filter(models.User.phone_number == user.phone_number).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 전화번호입니다.")

    hashed_password = security.get_password_hash(user.password)

    new_user = models.User(
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        status=models.UserStatusEnum.pending,
        role=models.UserRoleEnum.user
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login_user(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    rate_limit_key = f"user:{form_data.phone_number}"
    _enforce_rate_limit(rate_limit_key)

    user = db.query(models.User).filter(models.User.phone_number == form_data.phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")
    if user.status != models.UserStatusEnum.approved:
        raise HTTPException(status_code=403, detail="관리자 승인이 필요합니다.")

    _clear_rate_limit(rate_limit_key)

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/super-admin-login", response_model=schemas.Token)
def login_admin(form_data: schemas.AdminLogin, db: Session = Depends(get_db)):
    rate_limit_key = f"admin:{form_data.username}"
    _enforce_rate_limit(rate_limit_key)

    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    allowed_roles = [models.UserRoleEnum.admin, models.UserRoleEnum.super_admin]
    if not user or user.role not in allowed_roles:
        raise HTTPException(status_code=404, detail="관리자 계정을 찾을 수 없습니다.")
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    _clear_rate_limit(rate_limit_key)

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.put("/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not security.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="기존 비밀번호가 일치하지 않습니다.")

    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}
