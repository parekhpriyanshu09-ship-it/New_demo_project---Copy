from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from main_db import get_db
from models import PatrakEntry, DepartmentLog, EntryStatus, DEPARTMENTS
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/track", tags=["public tracking"])

class TimelineNode(BaseModel):
    department: str
    status: str
    timestamp: Optional[str] = None
    user: Optional[str] = None
    remarks: Optional[str] = None

class PublicTrackingResponse(BaseModel):
    patrak_id: str
    subject: str
    current_status: str
    current_department: str
    total_movements: int
    timeline: List[TimelineNode]

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
            pass # Invalid date format, skip filter
            
    if location:
        query = query.filter(PatrakEntry.sender_name.ilike(f"%{location}%"))
        
    entries = query.limit(10).all() # Limit results for public search
    
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
    # The system uses `unique_id` in the database.
    entry = db.query(PatrakEntry).filter(PatrakEntry.unique_id == patrak_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patrak not found or invalid ID")

    logs = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry.id
    ).order_by(DepartmentLog.received_at.asc()).all()

    timeline = []
    
    # We will build a timeline based on the actual logs to show exactly what was requested.
    # The exact requirement states: "Each step shows: Department Name, Status (Received / Forwarded / Pending), Date & Time, Officer/User, Remarks"
    
    # Instead of building the timeline from all departments statically, 
    # we'll build it similarly to the internal tracking to show the journey.
    # We will include all predefined departments, mark them as completed/current/pending.
    
    total_movements = len(logs)
    
    for idx, dept_name in enumerate(DEPARTMENTS):
        node_status = "Pending"
        if idx < entry.current_stage_index:
            node_status = "Forwarded"
        elif idx == entry.current_stage_index:
            node_status = "Received"
            
        timestamp_str = None
        user_name = None
        remarks = None
        
        # Find if there is a log for this department
        for log in logs:
            if log.department_index == idx:
                timestamp_str = log.received_at.strftime("%Y-%m-%dT%H:%M:%SZ") if log.received_at else None
                user_name = log.received_by_user.username if log.received_by_user else "System"
                remarks = log.remarks
                break
                
        # If no log yet, but it's the first department, use entry creation data
        if not timestamp_str and idx == 0 and node_status != "Pending":
            timestamp_str = entry.received_date.strftime("%Y-%m-%dT%H:%M:%SZ") if entry.received_date else None
            user_name = entry.creator.username if entry.creator else "System"
            remarks = entry.description or f"Patrak received and registered at {dept_name}."
            
        timeline.append(TimelineNode(
            department=dept_name,
            status=node_status,
            timestamp=timestamp_str,
            user=user_name,
            remarks=remarks
        ))

    current_status_mapped = "In Transit"
    if entry.status == EntryStatus.CLOSED:
        current_status_mapped = "Completed"
    elif entry.status == EntryStatus.ARCHIVED:
        current_status_mapped = "Archived"

    return PublicTrackingResponse(
        patrak_id=entry.unique_id,
        subject=entry.subject,
        current_status=current_status_mapped,
        current_department=entry.current_department,
        total_movements=total_movements,
        timeline=timeline
    )
