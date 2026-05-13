import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from database import settings
from main_db import init_db, engine, Base
from auth.router import router as auth_router
from routers.entries import router as entries_router
from routers.logs import router as logs_router
from routers.qr import router as qr_router
from routers.dashboard import router as dashboard_router
from routers.admin import router as admin_router
from routers.track import router as track_router
from routers.forward import router as forward_router
from middleware.security import SecurityHeadersMiddleware
from middleware.rate_limit import RateLimitMiddleware, LoginRateLimitMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="SCRB Gujarat Police Patrak System",
    description="Internal government courier/letter tracking system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
app.add_middleware(LoginRateLimitMiddleware, max_attempts=5, lockout_minutes=15)

app.include_router(auth_router)
app.include_router(entries_router)
app.include_router(logs_router)
app.include_router(qr_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(track_router)
app.include_router(forward_router)

@app.get("/")
async def root():
    return {
        "message": "SCRB Gujarat Police Patrak Tracking System",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)