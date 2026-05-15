from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from main_db import get_db
from models import PatrakEntry, PatrakMovement, MovementStatus, EntryStatus, User
from schemas import PublicTrackingResponse, TrackingNode, PatrakMovementResponse, PatrakEntryResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/track", tags=["public tracking"])


from sqlalchemy import or_, cast, String, func

class SearchResult(BaseModel):
    unique_id: str
    subject: str
    current_department: str
    received_date: datetime
    sender_name: str
    priority: Optional[str] = None
    status: Optional[str] = None
    date_label: Optional[str] = "Received Date"


@router.get("/search", response_model=List[SearchResult])
async def search_patraks(
    global_query: Optional[str] = None,
    subject: Optional[str] = None,
    sender_name: Optional[str] = None,
    unit: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    priority: Optional[str] = None,
    patrak_id: Optional[str] = None,
    department: Optional[str] = None,
    designation: Optional[str] = None,
    receiving_mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatrakEntry)
    parsed_date = None
    
    if global_query:
        g = f"%{global_query.lower()}%"
        
        # Try to parse the global query as a date
        for fmt in ('%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%d %b %Y', '%d %B %Y'):
            try:
                parsed_date = datetime.strptime(global_query.strip(), fmt).date()
                break
            except ValueError:
                pass
                
        conditions = [
            PatrakEntry.unique_id.ilike(g),
            PatrakEntry.subject.ilike(g),
            PatrakEntry.sender_name.ilike(g),
            PatrakEntry.sender_designation.ilike(g),
            PatrakEntry.current_department.ilike(g),
            PatrakEntry.description.ilike(g),
            PatrakEntry.receiving_mode.ilike(g),
            PatrakEntry.sender_email.ilike(g),
            PatrakEntry.fax_number.ilike(g),
            PatrakEntry.unit_district.ilike(g),
            PatrakEntry.send_to.ilike(g),
            cast(PatrakEntry.priority, String).ilike(g),
            cast(PatrakEntry.status, String).ilike(g),
            cast(PatrakEntry.received_date, String).ilike(g)
        ]
        
        if parsed_date:
            conditions.append(func.date(PatrakEntry.received_date) == parsed_date)
            conditions.append(PatrakEntry.movements.any(func.date(PatrakMovement.timestamp) == parsed_date))
            
        query = query.filter(or_(*conditions))
    
    if subject:
        query = query.filter(PatrakEntry.subject.ilike(f"%{subject}%"))
    if sender_name:
        query = query.filter(PatrakEntry.sender_name.ilike(f"%{sender_name}%"))
    if unit:
        query = query.filter(PatrakEntry.unit_district.ilike(f"%{unit}%"))
    if date_from:
        try:
            query = query.filter(PatrakEntry.received_date >= datetime.strptime(date_from, "%Y-%m-%d"))
        except ValueError: pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d")
            query = query.filter(PatrakEntry.received_date <= dt_to.replace(hour=23, minute=59, second=59))
        except ValueError: pass
    if priority:
        query = query.filter(PatrakEntry.priority == priority)
    if patrak_id:
        query = query.filter(PatrakEntry.unique_id.ilike(f"%{patrak_id}%"))
    if department:
        query = query.filter(PatrakEntry.current_department.ilike(f"%{department}%"))
    if designation:
        query = query.filter(PatrakEntry.sender_designation.ilike(f"%{designation}%"))
    if receiving_mode:
        query = query.filter(PatrakEntry.receiving_mode.ilike(f"%{receiving_mode}%"))
    
    entries = query.limit(20).all()
    
    results = []
    for e in entries:
        label = "Received Date"
        d_date = e.received_date
        
        if parsed_date:
            if e.received_date.date() != parsed_date:
                # check if movement matched
                for m in e.movements:
                    if m.timestamp.date() == parsed_date:
                        label = "Forwarded Date"
                        d_date = m.timestamp
                        break

        results.append(SearchResult(
            unique_id=e.unique_id,
            subject=e.subject,
            current_department=e.current_department,
            received_date=d_date,
            sender_name=e.sender_name,
            priority=e.priority.value if e.priority else "Normal",
            status=e.status.value if e.status else "In Transit",
            date_label=label
        ))
    
    return results


@router.get("/{patrak_id}", response_model=PublicTrackingResponse)
async def public_track_patrak(patrak_id: str, db: Session = Depends(get_db)):
    """
    Track a patrak using its unique ID.
    Returns dynamic movement history instead of fixed hierarchy.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.unique_id == patrak_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Patrak not found or invalid ID"
        )

    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry.id
    ).order_by(PatrakMovement.timestamp.asc()).all()

    tracking_movements = []
    
    for idx, movement in enumerate(movements):
        user = db.query(User).filter(User.id == movement.forwarded_by).first()
        
        tracking_movements.append(TrackingNode(
            from_department=movement.from_department,
            to_department=movement.to_department,
            status=movement.status.value if movement.status else "Forwarded",
            timestamp=movement.timestamp.strftime("%Y-%m-%d %H:%M:%S") if movement.timestamp else None,
            forwarded_by=user.username if user else "System",
            remarks=movement.remarks
        ))
    
    current_status = "In Transit"
    if entry.status == EntryStatus.CLOSED:
        current_status = "Completed"
    elif entry.status == EntryStatus.ARCHIVED:
        current_status = "Archived"

    return PublicTrackingResponse(
        patrak_id=entry.unique_id,
        subject=entry.subject,
        current_status=current_status,
        current_department=entry.current_department,
        sender_name=entry.sender_name,
        sender_designation=entry.sender_designation,
        priority=entry.priority.value if entry.priority else "Normal",
        total_movements=len(movements),
        movements=tracking_movements
    )


@router.get("/internal/{entry_id}")
async def internal_track_patrak(entry_id: int, db: Session = Depends(get_db)):
    """
    Internal tracking endpoint for authenticated users.
    Returns full entry details and all movements.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )

    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry.id
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

    entry_response = PatrakEntryResponse(
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

    return {
        "entry": entry_response,
        "movements": movement_responses,
        "current_department": entry.current_department,
        "total_movements": len(movements)
    }
