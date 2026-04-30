# backend/app/renew-dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from . import models, security
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        user_id = security.verify_token(token, credentials_exception)
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if current_user.status != models.UserStatusEnum.approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not approved")
    return current_user

def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)):
    allowed = [models.UserRoleEnum.admin, models.UserRoleEnum.super_admin]
    if current_user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires admin privileges")
    return current_user

def get_current_super_admin_user(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != models.UserRoleEnum.super_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires super_admin privileges")
    return current_user
