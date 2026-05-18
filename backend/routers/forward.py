from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from main_db import get_db
from models import User, PatrakEntry, PatrakMovement, MovementStatus, EntryStatus, DEPARTMENTS
from schemas import ForwardRequest, PatrakMovementResponse, AssignRequest
from auth.dependencies import require_not_viewer, get_client_ip
from datetime import datetime

router = APIRouter(prefix="/api/forward", tags=["forward"])


@router.post("", response_model=PatrakMovementResponse)
async def forward_patrak(
    forward_data: ForwardRequest,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Forward a patrak to any department dynamically.
    
    - Any department can forward to ANY other department
    - Creates a movement record with from/to department
    - Updates the entry's current_department
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == forward_data.entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )
    
    if entry.status == EntryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This entry has been closed and cannot be forwarded"
        )
    
    to_department = forward_data.to_department
    
    if to_department not in DEPARTMENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid department. Available: {', '.join(DEPARTMENTS)}"
        )
    
    from_department = entry.current_department
    
    if from_department == to_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot forward to the same department"
        )
    
    movement = PatrakMovement(
        entry_id=entry.id,
        from_department=from_department,
        to_department=to_department,
        forwarded_by=current_user.id,
        timestamp=datetime.utcnow(),
        remarks=forward_data.remarks,
        status=MovementStatus.FORWARDED
    )
    
    db.add(movement)
    
    entry.current_department = to_department
    entry.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(movement)
    
    return PatrakMovementResponse(
        id=movement.id,
        entry_id=movement.entry_id,
        from_department=movement.from_department,
        to_department=movement.to_department,
        forwarded_by=movement.forwarded_by,
        forwarded_by_name=current_user.username,
        timestamp=movement.timestamp,
        remarks=movement.remarks,
        status=movement.status
    )
    
    
@router.post("/assign", response_model=PatrakMovementResponse)
async def assign_patrak(
    assign_data: AssignRequest,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db)
):
    """
    Assign a patrak to a specific individual within the current department.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == assign_data.entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )
    
    if entry.status == EntryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This entry has been closed"
        )
    
    current_dept = entry.current_department
    
    movement = PatrakMovement(
        entry_id=entry.id,
        from_department=current_dept,
        to_department=current_dept,
        forwarded_by=current_user.id,
        timestamp=datetime.utcnow(),
        remarks=assign_data.remarks,
        status=MovementStatus.ASSIGNED,
        assigned_to=assign_data.assigned_to,
        assigned_designation=assign_data.assigned_designation
    )
    
    db.add(movement)
    entry.status = EntryStatus.ASSIGNED
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(movement)
    
    return PatrakMovementResponse(
        id=movement.id,
        entry_id=movement.entry_id,
        from_department=movement.from_department,
        to_department=movement.to_department,
        forwarded_by=movement.forwarded_by,
        forwarded_by_name=current_user.username,
        timestamp=movement.timestamp,
        remarks=movement.remarks,
        status=movement.status,
        assigned_to=movement.assigned_to,
        assigned_designation=movement.assigned_designation
    )


@router.get("/entry/{entry_id}/movements", response_model=list[PatrakMovementResponse])
async def get_entry_movements(
    entry_id: int,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db)
):
    """Get all movement history for an entry"""
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )
    
    movements = db.query(PatrakMovement).filter(
        PatrakMovement.entry_id == entry_id
    ).order_by(PatrakMovement.timestamp.asc()).all()
    
    result = []
    for m in movements:
        user = db.query(User).filter(User.id == m.forwarded_by).first()
        result.append(PatrakMovementResponse(
            id=m.id,
            entry_id=m.entry_id,
            from_department=m.from_department,
            to_department=m.to_department,
            forwarded_by=m.forwarded_by,
            forwarded_by_name=user.username if user else "Unknown",
            timestamp=m.timestamp,
            remarks=m.remarks,
            status=m.status,
            assigned_to=m.assigned_to,
            assigned_designation=m.assigned_designation
        ))
    
    return result


@router.post("/receive/{entry_id}")
async def receive_patrak(
    entry_id: int,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Mark a patrak as received at the current department.
    Creates a received movement record.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )
    
    if entry.status == EntryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This entry has been closed"
        )
    
    current_dept = entry.current_department
    
    movement = PatrakMovement(
        entry_id=entry.id,
        from_department=current_dept,
        to_department=current_dept,
        forwarded_by=current_user.id,
        timestamp=datetime.utcnow(),
        remarks=f"Received at {current_dept}",
        status=MovementStatus.RECEIVED
    )
    
    db.add(movement)
    db.commit()
    db.refresh(movement)
    
    return {
        "message": "Patrak received successfully",
        "movement_id": movement.id,
        "department": current_dept
    }


@router.post("/close/{entry_id}")
async def close_patrak(
    entry_id: int,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Close a patrak - marks it as completed/closed.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entry not found"
        )
    
    if entry.status == EntryStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This entry is already closed"
        )
    
    current_dept = entry.current_department
    
    movement = PatrakMovement(
        entry_id=entry.id,
        from_department=current_dept,
        to_department=current_dept,
        forwarded_by=current_user.id,
        timestamp=datetime.utcnow(),
        remarks="Patrak closed/completed",
        status=MovementStatus.CLOSED
    )
    
    db.add(movement)
    
    entry.status = EntryStatus.CLOSED
    entry.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Patrak closed successfully",
        "movement_id": movement.id
    }


@router.get("/departments")
async def get_departments(
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db)
):
    """Get list of all available departments"""
    return {
        "departments": DEPARTMENTS
    }
