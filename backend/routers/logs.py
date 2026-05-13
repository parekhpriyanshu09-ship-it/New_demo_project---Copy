from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from main_db import get_db
from models import User, PatrakMovement, PatrakEntry
from schemas import PaginatedResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/api/logs", tags=["logs"])

def build_movement_item(movement, db):
    """Build a rich movement item with full entry + user details."""
    forwarded_by_user = db.query(User).filter(User.id == movement.forwarded_by).first()
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == movement.entry_id).first()

    timestamp_str = None
    if movement.timestamp:
        timestamp_str = movement.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "id": movement.id,
        "entry_id": movement.entry_id,
        "entry_subject": entry.subject if entry else "Unknown",
        "entry_sender": entry.sender_name if entry else "Unknown",
        "entry_sender_designation": entry.sender_designation if entry else "",
        "entry_priority": entry.priority.value if entry and entry.priority else "Normal",
        "entry_current_department": entry.current_department if entry else "",
        "entry_status": entry.status.value if entry and entry.status else "",
        "from_department": movement.from_department,
        "to_department": movement.to_department,
        "forwarded_by_user_id": movement.forwarded_by,
        "forwarded_by_username": forwarded_by_user.username if forwarded_by_user else "Unknown",
        "forwarded_by_role": forwarded_by_user.role.value if forwarded_by_user and forwarded_by_user.role else "",
        "timestamp": timestamp_str,
        "remarks": movement.remarks,
        "status": movement.status.value if movement.status else "Forwarded",
    }


@router.get("", response_model=PaginatedResponse)
async def get_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    entry_id: Optional[int] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatrakMovement)

    if entry_id:
        query = query.filter(PatrakMovement.entry_id == entry_id)

    if department:
        query = query.filter(
            (PatrakMovement.from_department == department) | 
            (PatrakMovement.to_department == department)
        )

    total = query.count()
    movements = query.order_by(PatrakMovement.timestamp.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = [build_movement_item(movement, db) for movement in movements]

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

    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry_id
    ).order_by(PatrakMovement.timestamp.asc()).all()

    return [build_movement_item(movement, db) for movement in movements]
