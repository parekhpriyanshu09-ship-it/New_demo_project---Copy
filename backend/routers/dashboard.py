from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from main_db import get_db
from models import PatrakEntry, DepartmentLog, DEPARTMENTS
from schemas import DashboardStats, CalendarResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: Session = Depends(get_db)
):
    total_entries = db.query(PatrakEntry).count()

    active_entries = db.query(PatrakEntry).filter(PatrakEntry.status == "Active").count()

    closed_entries = db.query(PatrakEntry).filter(PatrakEntry.status == "Closed").count()

    department_counts = {}
    for dept in DEPARTMENTS:
        count = db.query(PatrakEntry).filter(
            PatrakEntry.current_department == dept
        ).count()
        department_counts[dept] = count

    return DashboardStats(
        total_entries=total_entries,
        active_entries=active_entries,
        closed_entries=closed_entries,
        department_counts=department_counts
    )

@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar(
    month: int = Query(1, ge=1, le=12),
    year: int = Query(None),
    view_type: str = Query("inward"),
    db: Session = Depends(get_db)
):
    if not year:
        from datetime import datetime
        year = datetime.now().year

    date_counts = {}

    if view_type == "outward":
        logs = db.query(DepartmentLog).filter(
            DepartmentLog.department_name == "CID Crime",
            extract('month', DepartmentLog.received_at) == month,
            extract('year', DepartmentLog.received_at) == year
        ).all()
        for log in logs:
            if log.received_at:
                date_key = log.received_at.date().isoformat()
                date_counts[date_key] = date_counts.get(date_key, 0) + 1
    else:
        entries = db.query(PatrakEntry).filter(
            extract('month', PatrakEntry.created_at) == month,
            extract('year', PatrakEntry.created_at) == year
        ).all()
        for entry in entries:
            if entry.created_at:
                date_key = entry.created_at.date().isoformat()
                date_counts[date_key] = date_counts.get(date_key, 0) + 1

    dates = [{"date": k, "count": v} for k, v in date_counts.items()]

    return CalendarResponse(
        month=month,
        year=year,
        dates=dates
    )

@router.get("/department-counts")
async def get_department_counts(
    db: Session = Depends(get_db)
):
    counts = []
    for dept in DEPARTMENTS:
        received_count = db.query(DepartmentLog).filter(
            DepartmentLog.department_name == dept
        ).count()

        current_count = db.query(PatrakEntry).filter(
            PatrakEntry.current_department == dept
        ).count()

        counts.append({
            "department": dept,
            "received": received_count,
            "current": current_count
        })

    return {"departments": counts}

@router.get("/receiving-modes")
async def get_receiving_modes(
    db: Session = Depends(get_db)
):
    results = db.query(
        PatrakEntry.receiving_mode,
        func.count(PatrakEntry.id)
    ).group_by(PatrakEntry.receiving_mode).all()
    
    counts = {
        "Physical": 0,
        "Mails": 0,
        "Fax": 0
    }
    
    for mode, count in results:
        # Normalize and map null modes to Physical
        norm_mode = mode if mode else "Physical"
        if norm_mode in counts:
            counts[norm_mode] += count
            
    modes_data = [
        {"mode": "Physical", "count": counts["Physical"]},
        {"mode": "Mails", "count": counts["Mails"]},
        {"mode": "Fax", "count": counts["Fax"]}
    ]
    
    return {"receiving_modes": modes_data}

@router.get("/date-chart")
async def get_date_chart(
    date: str = Query(None),
    view_type: str = Query("inward"),
    days: int = Query(7),
    db: Session = Depends(get_db)
):
    if date:
        from datetime import datetime
        target_date = datetime.strptime(date, "%Y-%m-%d").date()

        daily_data = []
        for i in range(days):
            from datetime import timedelta
            current_date = target_date - timedelta(days=(days-1)-i)

            if view_type == "outward":
                count = db.query(DepartmentLog).filter(
                    DepartmentLog.department_name == "CID Crime",
                    func.date(DepartmentLog.received_at) == current_date
                ).count()
            else:
                count = db.query(PatrakEntry).filter(
                    func.date(PatrakEntry.created_at) == current_date
                ).count()

            daily_data.append({
                "date": current_date.isoformat(),
                "count": count
            })

        return {"data": daily_data}

    from datetime import datetime, timedelta
    today = datetime.now().date()

    daily_data = []
    for i in range(days):
        current_date = today - timedelta(days=(days-1)-i)

        if view_type == "outward":
            count = db.query(DepartmentLog).filter(
                DepartmentLog.department_name == "CID Crime",
                func.date(DepartmentLog.received_at) == current_date
            ).count()
        else:
            count = db.query(PatrakEntry).filter(
                func.date(PatrakEntry.created_at) == current_date
            ).count()

        daily_data.append({
            "date": current_date.isoformat(),
            "count": count
        })

    return {"data": daily_data}

@router.get("/forward-stats")
async def get_forward_stats(
    db: Session = Depends(get_db)
):
    """
    Returns how many patraks each department forwarded to another department.
    A department forwards a patrak when the NEXT department receives it.
    """
    forward_counts = {}
    for idx, dept in enumerate(DEPARTMENTS):
        if idx < len(DEPARTMENTS) - 1:
            next_dept = DEPARTMENTS[idx + 1]
            count = db.query(DepartmentLog).filter(
                DepartmentLog.department_name == next_dept
            ).count()
        else:
            count = 0
        forward_counts[dept] = count

    return {"forward_counts": forward_counts}

@router.get("/department-forwarded")
async def get_department_forwarded(
    db: Session = Depends(get_db)
):
    """
    Returns for each department: how many patraks were forwarded TO other departments.
    Shows both received (incoming) and forwarded (outgoing) counts per department.
    """
    results = []
    for idx, dept in enumerate(DEPARTMENTS):
        received = db.query(DepartmentLog).filter(
            DepartmentLog.department_name == dept
        ).count()

        if idx < len(DEPARTMENTS) - 1:
            next_dept = DEPARTMENTS[idx + 1]
            forwarded = db.query(DepartmentLog).filter(
                DepartmentLog.department_name == next_dept
            ).count()
        else:
            forwarded = 0

        results.append({
            "department": dept,
            "received": received,
            "forwarded": forwarded
        })

    return {"departments": results}

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    logs = db.query(DepartmentLog).order_by(
        DepartmentLog.received_at.desc()
    ).limit(limit).all()

    activity = []
    for log in logs:
        entry = db.query(PatrakEntry).filter(PatrakEntry.id == log.entry_id).first()
        user = db.query(User).filter(User.id == log.received_by_user_id).first()

        activity.append({
            "id": log.id,
            "entry_id": log.entry_id,
            "entry_subject": entry.subject if entry else "Unknown",
            "entry_unique_id": entry.unique_id if entry else "Unknown",
            "department": log.department_name,
            "received_by": user.username if user else "Unknown",
            "received_at": log.received_at.isoformat() if log.received_at else None,
            "scan_method": log.scan_method
        })

    return {"activity": activity}