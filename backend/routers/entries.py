from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from typing import Optional, List
from main_db import get_db
from models import User, PatrakEntry, PatrakMovement, UserRole, Priority, EntryStatus, MovementStatus, DEPARTMENTS
from schemas import (
    PatrakEntryCreate, PatrakEntryUpdate, PatrakEntryResponse,
    PaginatedResponse, TrackingResponse, PatrakMovementResponse
)
from auth.dependencies import get_current_user, require_admin, require_admin_or_dg_office, require_create_entry_rights, get_client_ip
from utils.audit import log_entry_created, log_entry_updated, log_entry_deleted
from utils.qr_generator import generate_qr_code, create_qr_data
import uuid
from datetime import datetime
from utils.smart_parser import parse_smart_query

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
        unit_district=entry.unit_district,
        send_to=entry.send_to,
        current_department=entry.current_department,
        status=entry.status,
        qr_code_data=entry.qr_code_data,
        created_by=entry.created_by,
        created_at=entry.created_at,
        updated_at=entry.updated_at
    )

@router.get("/smart-search")
async def smart_search(
    q: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    intent = parse_smart_query(q)
    
    query = db.query(PatrakEntry)
    
    # Apply filters dynamically
    if intent["department"]:
        query = query.filter(PatrakEntry.current_department == intent["department"])
        
    if intent["action"]:
        if intent["action"] == "closed":
            query = query.filter(PatrakEntry.status == EntryStatus.CLOSED)
        elif intent["action"] == "pending":
            query = query.filter(PatrakEntry.status == EntryStatus.ACTIVE)
            
    if intent["priority"]:
        query = query.filter(PatrakEntry.priority == intent["priority"])
        
    if intent["mode"]:
        query = query.filter(PatrakEntry.receiving_mode == intent["mode"])
        
    if intent["date_start"] and intent["date_end"]:
        query = query.filter(PatrakEntry.received_date.between(intent["date_start"], intent["date_end"]))
        
    # Build summary text dynamically
    parts = []
    if intent["raw_priority"]: parts.append(intent["raw_priority"].lower())
    if intent["raw_mode"]: parts.append(intent["raw_mode"].lower())
    parts.append("tapals")
    if intent["raw_action"]: parts.append(intent["raw_action"].lower())
    if intent["raw_department"]: parts.append(f"from/at {intent['raw_department']}")
    if intent["raw_date_str"]: parts.append(intent["raw_date_str"].lower())
    
    # If it's a count query
    if intent["queryType"] == "count":
        total_count = query.count()
        summary_text = f"{total_count} {' '.join(parts)}"
        return {
            "parsed_intent": intent,
            "result_type": "analytics",
            "summary_text": summary_text.strip(),
            "count": total_count,
            "items": []
        }
    
    # Else it's a list query
    query = query.order_by(PatrakEntry.created_at.desc())
    total = query.count()
    entries = query.offset((page - 1) * per_page).limit(per_page).all()
    
    summary_text = f"Found {total} {' '.join(parts)}"
    
    return {
        "parsed_intent": intent,
        "result_type": "list",
        "summary_text": summary_text.strip(),
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "items": [entry_to_response(e) for e in entries]
    }

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
        search_clean = search.strip().lower()
        search_term = f"%{search_clean}%"
        
        conditions = [
            PatrakEntry.subject.ilike(search_term),
            PatrakEntry.sender_name.ilike(search_term),
            PatrakEntry.unique_id.ilike(search_term),
            PatrakEntry.description.ilike(search_term),
            PatrakEntry.sender_designation.ilike(search_term),
            PatrakEntry.current_department.ilike(search_term)
        ]
        
        import re
        import calendar
        import dateparser

        start_date = None
        end_date = None

        exact_formats = [
            "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y", 
            "%d %m %Y", "%Y-%m-%d", 
            "%d %b %Y", "%d %B %Y"
        ]
        
        for fmt in exact_formats:
            try:
                parsed_dt = datetime.strptime(search.strip(), fmt)
                start_date = parsed_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = parsed_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                break
            except ValueError:
                continue

        if not start_date:
            if re.match(r'^\d{4}$', search_clean):
                year = int(search_clean)
                start_date = datetime(year, 1, 1)
                end_date = datetime(year, 12, 31, 23, 59, 59, 999999)
            elif re.match(r'^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}$', search_clean):
                parsed_date = dateparser.parse(search_clean, settings={'TIMEZONE': 'UTC', 'PREFER_DAY_OF_MONTH': 'first'})
                if parsed_date:
                    start_date = parsed_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    last_day = calendar.monthrange(start_date.year, start_date.month)[1]
                    end_date = start_date.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            if not start_date:
                parsed_date = dateparser.parse(search_clean, settings={'TIMEZONE': 'UTC', 'DATE_ORDER': 'DMY'})
                if parsed_date:
                    start_date = parsed_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_date = parsed_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        if start_date and end_date:
            conditions.extend([
                PatrakEntry.received_date.between(start_date, end_date),
                PatrakEntry.created_at.between(start_date, end_date),
                PatrakMovement.timestamp.between(start_date, end_date)
            ])
            query = query.outerjoin(PatrakMovement, PatrakEntry.id == PatrakMovement.entry_id)
            
        query = query.filter(or_(*conditions)).distinct()

    if sort_order == "desc":
        query = query.order_by(getattr(PatrakEntry, sort_by).desc())
    else:
        query = query.order_by(getattr(PatrakEntry, sort_by).asc())

    total = query.count()

    entries = query.offset((page - 1) * per_page).limit(per_page).all()

    response_items = []
    for e in entries:
        resp = entry_to_response(e)
        if search:
            try:
                sd = start_date
                ed = end_date
            except NameError:
                sd = None
                ed = None

            if sd and ed:
                match_contexts = []
                if e.received_date and sd <= e.received_date <= ed:
                    match_contexts.append({"type": "received", "field": "Received Date", "value": e.received_date.strftime("%d %b %Y")})
                if e.created_at and sd <= e.created_at <= ed:
                    match_contexts.append({"type": "created", "field": "Created Date", "value": e.created_at.strftime("%d %b %Y")})
                    
                movements = db.query(PatrakMovement).filter(PatrakMovement.entry_id == e.id).all()
                for m in movements:
                    if m.timestamp and sd <= m.timestamp <= ed:
                        match_contexts.append({"type": "forwarded", "field": f"Forwarded to {m.to_department}", "value": m.timestamp.strftime("%d %b %Y · %I:%M %p")})
                        
                if match_contexts:
                    resp.match_contexts = match_contexts

        response_items.append(resp)

    return PaginatedResponse(
        items=response_items,
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
    """
    Create a new patrak entry.
    Uses the send_to field for initial department, or defaults to DG Office.
    Creates an initial movement record for the creation.
    """
    unique_id = f"PTRK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    qr_data = create_qr_data(0, unique_id, "scrb://")
    qr_image = generate_qr_code(qr_data)

    initial_department = entry_data.send_to if entry_data.send_to else DEPARTMENTS[0]

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
        unit_district=entry_data.unit_district,
        send_to=entry_data.send_to,
        current_department=initial_department,
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

    initial_movement = PatrakMovement(
        entry_id=new_entry.id,
        from_department=None,
        to_department=initial_department,
        forwarded_by=current_user.id,
        timestamp=datetime.utcnow(),
        remarks=f"Entry created and registered at {initial_department}",
        status=MovementStatus.CREATED
    )
    db.add(initial_movement)
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
    """
    Get tracking information for an entry using the new dynamic movement system.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry_id
    ).order_by(PatrakMovement.timestamp.asc()).all()

    movement_responses = []
    for m in movements:
        user = db.query(User).filter(User.id == m.forwarded_by).first()
        movement_responses.append(PatrakMovementResponse(
            id=m.id,
            entry_id=m.entry_id,
            from_department=m.from_department,
            to_department=m.to_department,
            forwarded_by=m.forwarded_by,
            forwarded_by_name=user.username if user else "Unknown",
            timestamp=m.timestamp,
            remarks=m.remarks,
            status=m.status
        ))

    return TrackingResponse(
        entry=entry_to_response(entry),
        movements=movement_responses,
        current_department=entry.current_department,
        total_movements=len(movements)
    )
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
    """
    Get tracking information for an entry using the new dynamic movement system.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry_id
    ).order_by(PatrakMovement.timestamp.asc()).all()

    movement_responses = []
    for m in movements:
        user = db.query(User).filter(User.id == m.forwarded_by).first()
        movement_responses.append(PatrakMovementResponse(
            id=m.id,
            entry_id=m.entry_id,
            from_department=m.from_department,
            to_department=m.to_department,
            forwarded_by=m.forwarded_by,
            forwarded_by_name=user.username if user else "Unknown",
            timestamp=m.timestamp,
            remarks=m.remarks,
            status=m.status
        ))

    return TrackingResponse(
        entry=entry_to_response(entry),
        movements=movement_responses,
        current_department=entry.current_department,
        total_movements=len(movements)
    )
