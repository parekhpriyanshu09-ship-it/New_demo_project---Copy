from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from main_db import get_db
from models import PatrakEntry, PatrakMovement, MovementStatus, EntryStatus, User
from schemas import PublicTrackingResponse, TrackingNode, PatrakMovementResponse, PatrakEntryResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import re

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
    date: Optional[str] = None,
    fromDate: Optional[str] = None,
    toDate: Optional[str] = None,
    senderLocation: Optional[str] = None,
    receiverDepartment: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    patrakId: Optional[str] = None,
    keyword: Optional[str] = None,
    senderName: Optional[str] = None,
    smart_query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PatrakEntry)
    
    # 1. Apply Explicit Filters (From Advanced Popup)
    if keyword:
        query = query.filter(or_(
            PatrakEntry.subject.ilike(f"%{keyword}%"),
            PatrakEntry.description.ilike(f"%{keyword}%"),
            PatrakEntry.unique_id.ilike(f"%{keyword}%")
        ))
    if date:
        try:
            d = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(PatrakEntry.received_date) == d)
        except ValueError: pass
    if fromDate:
        try:
            d = datetime.strptime(fromDate, "%Y-%m-%d").date()
            query = query.filter(func.date(PatrakEntry.received_date) >= d)
        except ValueError: pass
    if toDate:
        try:
            d = datetime.strptime(toDate, "%Y-%m-%d").date()
            query = query.filter(func.date(PatrakEntry.received_date) <= d)
        except ValueError: pass
    if senderLocation:
        query = query.filter(PatrakEntry.unit_district.ilike(f"%{senderLocation}%"))
    if receiverDepartment:
        query = query.filter(PatrakEntry.current_department.ilike(f"%{receiverDepartment}%"))
    if status:
        query = query.filter(cast(PatrakEntry.status, String).ilike(f"%{status}%"))
    if priority:
        query = query.filter(cast(PatrakEntry.priority, String).ilike(f"%{priority}%"))
    if patrakId:
        query = query.filter(PatrakEntry.unique_id.ilike(f"%{patrakId}%"))
    if senderName:
        query = query.filter(PatrakEntry.sender_name.ilike(f"%{senderName}%"))

    # 2. Apply Smart AI Query
    if smart_query:
        sq = smart_query.lower()
        extracted_priority = None
        if 'urgent' in sq or 'high' in sq: extracted_priority = 'HIGH'
        elif 'medium' in sq: extracted_priority = 'MEDIUM'
        
        extracted_status = None
        if 'pending' in sq: extracted_status = 'Pending'
        elif 'received' in sq: extracted_status = 'Received'
        elif 'completed' in sq or 'closed' in sq: extracted_status = 'Closed'
        elif 'forwarded' in sq: extracted_status = 'Forwarded'
        
        extracted_date = None
        today = datetime.now().date()
        if 'today' in sq: extracted_date = today
        elif 'yesterday' in sq: extracted_date = today - timedelta(days=1)
        else:
            match = re.search(r'\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b', sq)
            if match:
                try:
                    month_num = datetime.strptime(match.group(2), '%b').month
                    extracted_date = datetime(today.year, month_num, int(match.group(1))).date()
                except: pass

        stop_words = {'from', 'on', 'by', 'tapal', 'patrak', 'between', 'to', 'urgent', 'high', 'pending', 'received', 'today', 'yesterday', 'the', 'a', 'in', 'of'}
        words = [w for w in sq.split() if w not in stop_words and not re.match(r'^\d{1,2}$', w)]
        
        q1 = query
        # Only apply extracted fields if not already explicitly provided
        if extracted_priority and not priority: q1 = q1.filter(cast(PatrakEntry.priority, String).ilike(f"%{extracted_priority}%"))
        if extracted_status and not status: q1 = q1.filter(cast(PatrakEntry.status, String).ilike(f"%{extracted_status}%"))
        if extracted_date and not date and not fromDate and not toDate: q1 = q1.filter(func.date(PatrakEntry.received_date) == extracted_date)
        
        if words:
            for w in words:
                q1 = q1.filter(or_(
                    PatrakEntry.subject.ilike(f"%{w}%"),
                    PatrakEntry.sender_name.ilike(f"%{w}%"),
                    PatrakEntry.unit_district.ilike(f"%{w}%"),
                    PatrakEntry.current_department.ilike(f"%{w}%"),
                    PatrakEntry.unique_id.ilike(f"%{w}%")
                ))
                
        entries = q1.limit(50).all()
        
        # Fallback Search: broad match
        if not entries and (words or extracted_status or extracted_priority or extracted_date):
            q2 = query
            conditions = []
            for w in sq.split():
                if w not in ('from', 'on', 'by', 'tapal', 'patrak', 'the'):
                    conditions.append(or_(
                        PatrakEntry.subject.ilike(f"%{w}%"),
                        PatrakEntry.sender_name.ilike(f"%{w}%"),
                        PatrakEntry.unit_district.ilike(f"%{w}%"),
                        PatrakEntry.current_department.ilike(f"%{w}%"),
                        PatrakEntry.unique_id.ilike(f"%{w}%"),
                        cast(PatrakEntry.status, String).ilike(f"%{w}%"),
                        cast(PatrakEntry.priority, String).ilike(f"%{w}%")
                    ))
            if conditions:
                q2 = q2.filter(or_(*conditions))
            entries = q2.limit(50).all()
    else:
        entries = query.limit(50).all()
    
    results = []
    for e in entries:
        results.append(SearchResult(
            unique_id=e.unique_id,
            subject=e.subject,
            current_department=e.current_department,
            received_date=e.received_date,
            sender_name=e.sender_name,
            priority=e.priority.value if e.priority else "Normal",
            status=e.status.value if e.status else "In Transit",
            date_label="Received Date"
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
