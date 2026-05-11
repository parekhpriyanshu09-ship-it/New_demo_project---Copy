from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from main_db import get_db
from models import User, UserRole
from schemas import (
    UserCreate, UserResponse, LoginRequest, TokenResponse,
    RefreshRequest, UserUpdate
)
from auth.utils import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_access_token, verify_refresh_token,
    is_account_locked, get_lockout_time, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES
)
from auth.dependencies import get_current_user, get_client_ip
from utils.audit import log_login, log_logout, log_user_created, log_action

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db), request: Request = None):
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    hashed_pw = hash_password(user_data.password)

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        role=UserRole.VIEWER,
        department=user_data.department,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, new_user.id, "USER_REGISTERED", "auth", get_client_ip(request), "Self-registration")

    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db), request: Request = None):
    user = db.query(User).filter(User.username == login_data.username).first()

    ip_address = get_client_ip(request)

    if not user:
        log_login(db, None, ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(login_data.password, user.hashed_password):
        user.failed_attempts += 1

        if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
            user.lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            log_login(db, user.id, ip_address, success=False)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked. Too many failed attempts. Try again in {LOCKOUT_DURATION_MINUTES} minutes."
            )

        db.commit()
        log_login(db, user.id, ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if is_account_locked(user.lockout_until):
        lockout_minutes = get_lockout_time(user.lockout_until)
        log_login(db, user.id, ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked. Try again in {lockout_minutes} minutes."
        )

    if not user.is_active:
        log_login(db, user.id, ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    user.failed_attempts = 0
    user.lockout_until = None
    user.last_login = datetime.utcnow()
    db.commit()

    log_login(db, user.id, ip_address, success=True)

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 30
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), request: Request = None):
    log_logout(db, current_user.id, get_client_ip(request))

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_data: RefreshRequest, response: Response, db: Session = Depends(get_db)):
    payload = verify_refresh_token(refresh_data.refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    if is_account_locked(user.lockout_until):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value if hasattr(user.role, 'value') else user.role})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 30
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user