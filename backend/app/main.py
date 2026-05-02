from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from . import models
from .routers import auth, admin, schedules, applications, mypage, notices
import asyncio
from datetime import datetime, timedelta
import logging
import os

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

enable_api_docs = os.getenv("ENABLE_API_DOCS", "false").lower() == "true"

app = FastAPI(
    title="서울올림픽파크텔 인력 관리 시스템 API",
    docs_url="/docs" if enable_api_docs else None,
    redoc_url="/redoc" if enable_api_docs else None,
    openapi_url="/openapi.json" if enable_api_docs else None,
)

# CORS 설정

def _parse_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]

    # 보안 기본값: 와일드카드(*)는 허용하지 않음
    origins = [origin for origin in origins if origin != "*"]

    if not origins:
        origins = [
            "http://localhost:3000",
            "https://parktel-frontend-resu.onrender.com",
        ]

    return origins


allowed_origins = _parse_allowed_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def set_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(mypage.router, prefix="/api")
app.include_router(notices.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "서울올림픽파크텔 API", "status": "running"}


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
