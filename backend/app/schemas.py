from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from .models import UserRoleEnum, UserStatusEnum, ApplicationStatusEnum
import re

# --- Schedule Schemas ---
class ScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    start_time_str: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time_str: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    work_date: datetime
    capacity: int = Field(gt=0)

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    current_applicants: int
    
    class Config:
        from_attributes = True  # 수정됨

class ScheduleWithPendingCount(Schedule):
    pending_applicants: int = 0

# --- User Schemas ---
class UserBase(BaseModel):
    phone_number: str
    
    @validator('phone_number')
    def phone_validation(cls, v):
        if not re.match(r'^\d{10,11}$', v):
            raise ValueError("유효하지 않은 전화번호 형식입니다 (10~11자리 숫자).")
        return v

class UserCreate(UserBase):
    pass

class User(BaseModel):
    id: int
    phone_number: str
    role: UserRoleEnum
    status: UserStatusEnum
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True  # 수정됨

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    phone_number: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

# --- Application Schemas ---
class ApplicationBase(BaseModel):
    schedule_id: int

class ApplicationCreate(ApplicationBase):
    pass

class Application(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    status: ApplicationStatusEnum
   
    schedule: Optional[Schedule] = None
    user: Optional[User] = None
    
    class Config:
        from_attributes = True  # 수정됨

# --- Admin Schemas ---
class UserApproval(BaseModel):
    user_id: int
    status: UserStatusEnum

class GrantAdmin(BaseModel):
    user_id: int
    username: str

class ApplicationApproval(BaseModel):
    application_id: int
    new_status: ApplicationStatusEnum

# --- Notice Schemas ---
class NoticeBase(BaseModel):
    title: str
    content: str
    is_pinned: Optional[bool] = False

class NoticeCreate(NoticeBase):
    pass

class NoticeUpdate(NoticeBase):
    pass

class Notice(NoticeBase):
    id: int
    created_at: datetime
    view_count: int

    class Config:
        from_attributes = True  # 수정됨
