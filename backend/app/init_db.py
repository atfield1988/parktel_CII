# backend/app/renew-init_db.py
from .database import SessionLocal, engine
from .models import User, Base, UserRoleEnum, UserStatusEnum
from .security import get_password_hash

def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # super_admin (supernova / kspo88!)
        super_admin = db.query(User).filter(User.username == "supernova").first()
        if not super_admin:
            print("Creating super_admin user (supernova)...")
            admin_user = User(
                phone_number="01099074438",
                username="supernova",
                hashed_password=get_password_hash("kspo88!"),
                role=UserRoleEnum.super_admin,
                status=UserStatusEnum.approved
            )
            db.add(admin_user)
            db.commit()
            print("super_admin 'supernova' created.")

        # admin (olympic88 / banquet88!)
        admin = db.query(User).filter(User.username == "olympic88").first()
        if not admin:
            print("Creating admin user (olympic88)...")
            admin_user = User(
                phone_number="01000000002",
                username="olympic88",
                hashed_password=get_password_hash("banquet88!"),
                role=UserRoleEnum.admin,
                status=UserStatusEnum.approved
            )
            db.add(admin_user)
            db.commit()
            print("admin 'olympic88' created.")

    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database and creating initial admin/superadmin...")
    init_database()
