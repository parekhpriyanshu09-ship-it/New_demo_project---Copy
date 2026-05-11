from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from main_db import get_db
from models import User, PatrakEntry, DepartmentLog, UserRole, Priority, EntryStatus, DEPARTMENTS, DEPARTMENT_INDEX
from schemas import (
    PatrakEntryCreate, PatrakEntryUpdate, PatrakEntryResponse,
    PaginatedResponse, TrackingResponse, DepartmentLogResponse
)
from auth.dependencies import get_current_user, require_admin, require_admin_or_dg_office, require_create_entry_rights, get_client_ip
from utils.audit import log_entry_created, log_entry_updated, log_entry_deleted
from utils.qr_generator import generate_qr_code, create_qr_data
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/entries", tags=["entries"])

def entry_to_response(entry: PatrakEntry) -> PatrakEntryResponse:
    return PatrakEntryResponse(
        id=entry.id,
        unique_id=entry.unique_id,
        subject=entry.subject,
        sender_name=entry.sender_name,
        sender_designation=entry.sender_designation,
        received_date=entry.received_date,
        priority=entry.priority,
        description=entry.description,
        receiving_mode=entry.receiving_mode,
        sender_email=entry.sender_email,
        fax_number=entry.fax_number,
        current_department=entry.current_department,
        current_stage_index=entry.current_stage_index,
        status=entry.status,
        qr_code_data=entry.qr_code_data,
        created_by=entry.created_by,
        created_at=entry.created_at,
        updated_at=entry.updated_at
    )

@router.get("", response_model=PaginatedResponse)
async def get_entries(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|received_date|priority)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    query = db.query(PatrakEntry)

    if department:
        query = query.filter(PatrakEntry.current_department == department)

    if priority:
        query = query.filter(PatrakEntry.priority == priority)

    if status_filter:
        query = query.filter(PatrakEntry.status == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                PatrakEntry.subject.ilike(search_term),
                PatrakEntry.sender_name.ilike(search_term),
                PatrakEntry.unique_id.ilike(search_term),
                PatrakEntry.description.ilike(search_term),
                PatrakEntry.sender_designation.ilike(search_term),
                PatrakEntry.current_department.ilike(search_term)
            )
        )

    if sort_order == "desc":
        query = query.order_by(getattr(PatrakEntry, sort_by).desc())
    else:
        query = query.order_by(getattr(PatrakEntry, sort_by).asc())

    total = query.count()

    entries = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedResponse(
        items=[entry_to_response(e) for e in entries],
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@router.post("", response_model=PatrakEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry_data: PatrakEntryCreate,
    current_user: User = Depends(require_create_entry_rights),
    db: Session = Depends(get_db),
    request: Request = None
):
    unique_id = f"PTRK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    qr_data = create_qr_data(0, unique_id, "scrb://")
    qr_image = generate_qr_code(qr_data)

    new_entry = PatrakEntry(
        unique_id=unique_id,
        subject=entry_data.subject,
        sender_name=entry_data.sender_name,
        sender_designation=entry_data.sender_designation,
        received_date=entry_data.received_date,
        priority=entry_data.priority,
        description=entry_data.description,
        receiving_mode=entry_data.receiving_mode or "Physical",
        sender_email=entry_data.sender_email,
        fax_number=entry_data.fax_number,
        current_department=DEPARTMENTS[0],
        current_stage_index=0,
        status=EntryStatus.ACTIVE,
        qr_code_data=qr_image,
        created_by=current_user.id
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    qr_data["entry_id"] = new_entry.id
    new_entry.qr_code_data = generate_qr_code(qr_data)
    db.commit()

    log_entry_created(db, current_user.id, new_entry.id, get_client_ip(request))

    return entry_to_response(new_entry)

@router.get("/{entry_id}", response_model=PatrakEntryResponse)
async def get_entry(
    entry_id: int,
    db: Session = Depends(get_db)
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    return entry_to_response(entry)

@router.put("/{entry_id}", response_model=PatrakEntryResponse)
async def update_entry(
    entry_id: int,
    entry_data: PatrakEntryUpdate,
    current_user: User = Depends(require_create_entry_rights),
    db: Session = Depends(get_db),
    request: Request = None
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    update_data = entry_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)

    log_entry_updated(db, current_user.id, entry_id, get_client_ip(request))

    return entry_to_response(entry)

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    db.delete(entry)
    db.commit()

    log_entry_deleted(db, current_user.id, entry_id, get_client_ip(request))

    return None

@router.get("/{entry_id}/tracking", response_model=TrackingResponse)
async def get_tracking(
    entry_id: int,
    db: Session = Depends(get_db)
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    logs = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry_id
    ).order_by(DepartmentLog.received_at.asc()).all()

    logs_response = [
        DepartmentLogResponse(
            id=log.id,
            entry_id=log.entry_id,
            department_name=log.department_name,
            department_index=log.department_index,
            received_by_user_id=log.received_by_user_id,
            received_at=log.received_at,
            remarks=log.remarks,
            scan_method=log.scan_method
        ) for log in logs
    ]

    timeline = []
    for idx, dept_name in enumerate(DEPARTMENTS):
        node = {
            "department": dept_name,
            "index": idx,
            "status": "pending",
            "log": None
        }

        if idx < entry.current_stage_index:
            node["status"] = "completed"
        elif idx == entry.current_stage_index:
            node["status"] = "current"
        else:
            node["status"] = "pending"

        for log in logs:
            if log.department_index == idx:
                node["log"] = {
                    "received_at": log.received_at.isoformat() if log.received_at else None,
                    "received_by": log.received_by_user.username if log.received_by_user else None,
                    "remarks": log.remarks,
                    "scan_method": log.scan_method
                }
                break

        timeline.append(node)

    return TrackingResponse(
        entry=entry_to_response(entry),
        logs=logs_response,
        timeline=timeline
    )