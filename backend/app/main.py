# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models
from .routers import auth, admin, schedules, applications, mypage, notices
import asyncio
from datetime import datetime, timedelta
import logging
import os

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="서울올림픽파크텔 인력 관리 시스템 API")

# CORS 설정
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔧 [수정 핵심] prefix 중복 제거
# routers/* 파일 내부에 이미 prefix(예: /auth)가 정의되어 있으므로,
# 여기서는 공통 경로인 "/api"만 지정하면 됩니다.
# 최종 경로는 "/api" + "/auth" + "/register" = "/api/auth/register"가 됩니다.

app.include_router(auth.router, prefix="/api") 
app.include_router(admin.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(mypage.router, prefix="/api")
app.include_router(notices.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "서울올림픽파크텔 API", "status": "running", "version": "1.0"}

@app.get("/api")
def api_root():
    return {"message": "Parktel Schedule API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# 백그라운드: 45일 지난 스케줄 삭제
async def cleanup_old_schedules_periodic():
    while True:
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(days=45)
            old_schedules = db.query(models.Schedule).filter(models.Schedule.work_date < cutoff).all()
            if old_schedules:
                logging.info(f"Cleaning up {len(old_schedules)} old schedules (older than 45 days)")
                for s in old_schedules:
                    db.delete(s)
                db.commit()
        except Exception as e:
            logging.error(f"Error during cleanup_old_schedules: {e}")
            db.rollback()
        finally:
            db.close()
        await asyncio.sleep(24 * 3600)

@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기화"""
    logging.info("Starting Parktel Schedule API...")
    
    # 초기 관리자 계정 생성
    try:
        from .init_db import init_database
        init_database()
        logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
    
    # 백그라운드 작업 시작
    asyncio.create_task(cleanup_old_schedules_periodic())
