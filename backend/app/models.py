# backend/app/models.py
import enum
import re
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship, validates
from .database import Base

# --- UserRole / UserStatus ---
class UserRoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"
    super_admin = "super_admin"

class UserStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)

    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.user)
    status = Column(Enum(UserStatusEnum), default=UserStatusEnum.pending)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")

    @validates('phone_number')
    def validate_phone_number(self, key, phone_number):
        if not re.match(r'^\d{10,11}$', phone_number):
            raise ValueError("유효하지 않은 전화번호 형식입니다 (10~11자리 숫자).")
        return phone_number

# --- Schedule ---
class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500))
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)

    start_time_str = Column(String(5), nullable=False)
    end_time_str = Column(String(5), nullable=False)

    work_date = Column(DateTime(timezone=True), nullable=False)

    capacity = Column(Integer, default=1)
    current_applicants = Column(Integer, default=0)

    applications = relationship("Application", back_populates="schedule", cascade="all, delete-orphan")

    @validates('start_time_str', 'end_time_str')
    def validate_time_format(self, key, time_str):
        if not re.match(r'^\d{2}:\d{2}$', time_str):
            raise ValueError("시간 형식은 'HH:MM' 이어야 합니다.")
        return time_str

# --- ApplicationStatusEnum ---
class ApplicationStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

# --- Application ---
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    status = Column(Enum(ApplicationStatusEnum), default=ApplicationStatusEnum.pending)

    user = relationship("User", back_populates="applications")
    schedule = relationship("Schedule", back_populates="applications")

# --- Notice ---
class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(String(4000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    view_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
