from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from main_db import get_db
from models import PatrakEntry, PatrakMovement, MovementStatus, EntryStatus, User
from schemas import PublicTrackingResponse, TrackingNode, PatrakMovementResponse, PatrakEntryResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/track", tags=["public tracking"])


class SearchResult(BaseModel):
    unique_id: str
    subject: str
    current_department: str
    received_date: datetime
    sender_name: str


@router.get("/search", response_model=List[SearchResult])
async def search_patraks(
    subject: Optional[str] = None,
    date: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatrakEntry)
    
    if subject:
        query = query.filter(PatrakEntry.subject.ilike(f"%{subject}%"))
    
    if date:
        try:
            search_date = datetime.strptime(date, "%Y-%m-%d")
            query = query.filter(
                PatrakEntry.received_date >= search_date,
                PatrakEntry.received_date < search_date.replace(hour=23, minute=59, second=59)
            )
        except ValueError:
            pass
    
    if location:
        query = query.filter(PatrakEntry.sender_name.ilike(f"%{location}%"))
    
    entries = query.limit(10).all()
    
    return [
        SearchResult(
            unique_id=e.unique_id,
            subject=e.subject,
            current_department=e.current_department,
            received_date=e.received_date,
            sender_name=e.sender_name
        ) for e in entries
    ]


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
