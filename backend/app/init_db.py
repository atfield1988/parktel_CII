from .database import SessionLocal, engine
from .models import User, Base, UserRoleEnum, UserStatusEnum
from .security import get_password_hash
import os


def _create_initial_user_if_needed(db, *, username: str, phone_number: str, role: UserRoleEnum, env_password_key: str):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        return

    password = os.getenv(env_password_key)
    if not password:
        print(f"[SECURITY] Skip creating '{username}': env '{env_password_key}' is not set.")
        return

    print(f"Creating initial user: {username} ({role.value})")
    user = User(
        phone_number=phone_number,
        username=username,
        hashed_password=get_password_hash(password),
        role=role,
        status=UserStatusEnum.approved,
    )
    db.add(user)
    db.commit()


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _create_initial_user_if_needed(
            db,
            username=os.getenv("INITIAL_SUPER_ADMIN_USERNAME", "supernova"),
            phone_number=os.getenv("INITIAL_SUPER_ADMIN_PHONE", "01099074438"),
            role=UserRoleEnum.super_admin,
            env_password_key="INITIAL_SUPER_ADMIN_PASSWORD",
        )

        _create_initial_user_if_needed(
            db,
            username=os.getenv("INITIAL_ADMIN_USERNAME", "olympic88"),
            phone_number=os.getenv("INITIAL_ADMIN_PHONE", "01000000002"),
            role=UserRoleEnum.admin,
            env_password_key="INITIAL_ADMIN_PASSWORD",
        )
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database with environment-based initial accounts...")
    init_database()
