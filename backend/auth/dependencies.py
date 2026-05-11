from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from main_db import get_db
from models import User, UserRole
from auth.utils import verify_access_token, is_account_locked, get_lockout_time

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    lockout_minutes = get_lockout_time(user.lockout_until)
    if lockout_minutes is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked. Try again in {lockout_minutes} minutes."
        )

    return user

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        allowed_strings = []
        for r in allowed_roles:
            if hasattr(r, "value"):
                allowed_strings.append(str(r.value).lower())
            else:
                allowed_strings.append(str(r).lower())
                
        user_role = current_user.role
        if hasattr(user_role, "value"):
            user_role_str = str(user_role.value).lower()
        else:
            user_role_str = str(user_role).lower()
            
        if user_role_str not in allowed_strings:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

require_admin = require_roles([UserRole.ADMIN])
require_admin_or_dg_office = require_roles([UserRole.ADMIN, UserRole.DG_OFFICE])
require_not_viewer = require_roles([UserRole.ADMIN, UserRole.DG_OFFICE, UserRole.DEPARTMENT_USER])

async def require_create_entry_rights(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role in [UserRole.ADMIN.value, UserRole.DG_OFFICE.value]:
        return current_user
    if current_user.department == "DG Office":
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions to create entries"
    )

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"