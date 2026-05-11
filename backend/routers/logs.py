from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from main_db import get_db
from models import User, DepartmentLog, PatrakEntry, UserRole
from schemas import DepartmentLogResponse, PaginatedResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/logs", tags=["logs"])

def build_log_item(log, db):
    """Build a rich log item with full entry + user details."""
    received_by_user = db.query(User).filter(User.id == log.received_by_user_id).first()
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == log.entry_id).first()

    # Serialize received_at as UTC ISO string with 'Z' suffix
    # datetime.utcnow() stores UTC but as a naive datetime (no tzinfo).
    # Adding 'Z' tells JavaScript it is UTC, so it converts correctly to IST on the client.
    received_at_utc = None
    if log.received_at:
        received_at_utc = log.received_at.strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "id": log.id,
        "entry_id": log.entry_id,
        "entry_subject": entry.subject if entry else "Unknown",
        "entry_sender": entry.sender_name if entry else "Unknown",
        "entry_sender_designation": entry.sender_designation if entry else "",
        "entry_priority": entry.priority if entry else "Normal",
        "entry_current_department": entry.current_department if entry else "",
        "entry_status": entry.status if entry else "",
        "department_name": log.department_name,
        "department_index": log.department_index,
        "received_by_user_id": log.received_by_user_id,
        "received_by_username": received_by_user.username if received_by_user else "Unknown",
        "received_by_fullname": received_by_user.full_name if received_by_user and hasattr(received_by_user, 'full_name') and received_by_user.full_name else (received_by_user.username if received_by_user else "Unknown"),
        "received_by_role": received_by_user.role if received_by_user else "",
        "received_at": received_at_utc,
        "remarks": log.remarks,
        "scan_method": log.scan_method,
    }



@router.get("", response_model=PaginatedResponse)
async def get_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    entry_id: Optional[int] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DepartmentLog)

    if entry_id:
        query = query.filter(DepartmentLog.entry_id == entry_id)

    if department:
        query = query.filter(DepartmentLog.department_name == department)

    total = query.count()
    logs = query.order_by(DepartmentLog.received_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = [build_log_item(log, db) for log in logs]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )


@router.get("/entry/{entry_id}", response_model=list)
async def get_entry_logs(
    entry_id: int,
    db: Session = Depends(get_db)
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    logs = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry_id
    ).order_by(DepartmentLog.received_at.asc()).all()

    return [build_log_item(log, db) for log in logs]