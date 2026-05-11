from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from main_db import get_db
from models import User, PatrakEntry, DepartmentLog, UserRole, DEPARTMENTS, DEPARTMENT_INDEX
from schemas import QRCodeResponse, QRScanRequest
from auth.dependencies import get_current_user, require_not_viewer, get_client_ip
from utils.qr_generator import generate_qr_code, create_qr_data
from utils.audit import log_qr_scan
from datetime import datetime
import io
from PIL import Image
import base64

router = APIRouter(prefix="/api/qr", tags=["qr"])

@router.get("/generate/{entry_id}", response_model=QRCodeResponse)
async def generate_qr(
    entry_id: int,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db)
):
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    qr_data = create_qr_data(entry.id, entry.unique_id, "scrb://")
    qr_image = generate_qr_code(qr_data)

    entry.qr_code_data = qr_image
    db.commit()

    return QRCodeResponse(
        entry_id=entry.id,
        unique_id=entry.unique_id,
        qr_image=qr_image
    )

@router.post("/scan")
async def scan_qr(
    scan_data: QRScanRequest,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    # Department users can only scan for their own department
    if current_user.role == UserRole.DEPARTMENT_USER.value:
        if current_user.department != scan_data.department_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You can only scan entries for your department ({current_user.department})"
            )

    entry = db.query(PatrakEntry).filter(PatrakEntry.id == scan_data.entry_id).first()

    if not entry:
        log_qr_scan(db, current_user.id, scan_data.entry_id, scan_data.department_name, get_client_ip(request), False)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if scan_data.department_name not in DEPARTMENT_INDEX:
        log_qr_scan(db, current_user.id, scan_data.entry_id, scan_data.department_name, get_client_ip(request), False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department")

    dept_index = DEPARTMENT_INDEX[scan_data.department_name]

    if dept_index != entry.current_stage_index:
        log_qr_scan(db, current_user.id, scan_data.entry_id, scan_data.department_name, get_client_ip(request), False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This entry is currently at '{entry.current_department}'. Cannot scan for '{scan_data.department_name}' yet."
        )

    existing_log = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry.id,
        DepartmentLog.department_index == dept_index
    ).first()

    if existing_log:
        log_qr_scan(db, current_user.id, scan_data.entry_id, scan_data.department_name, get_client_ip(request), False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This entry has already been received at this department"
        )

    new_log = DepartmentLog(
        entry_id=entry.id,
        department_name=scan_data.department_name,
        department_index=dept_index,
        received_by_user_id=current_user.id,
        received_at=datetime.utcnow(),
        scan_method="camera"
    )

    db.add(new_log)

    if dept_index < len(DEPARTMENTS) - 1:
        entry.current_department = DEPARTMENTS[dept_index + 1]
        entry.current_stage_index = dept_index + 1
    else:
        entry.current_department = DEPARTMENTS[-1]
        entry.status = "Closed"

    entry.updated_at = datetime.utcnow()
    db.commit()

    log_qr_scan(db, current_user.id, scan_data.entry_id, scan_data.department_name, get_client_ip(request), True)

    return {
        "message": "QR scanned successfully",
        "entry_id": entry.id,
        "department": scan_data.department_name,
        "log_id": new_log.id
    }

@router.post("/upload-scan")
async def upload_scan(
    entry_id: int = Form(...),
    department_name: str = Form(...),
    remarks: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    # Department users can only scan for their own department
    if current_user.role == UserRole.DEPARTMENT_USER.value:
        if current_user.department != department_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You can only scan entries for your department ({current_user.department})"
            )

    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds 5MB limit")

    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Allowed: JPEG, PNG")

    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        log_qr_scan(db, current_user.id, entry_id, department_name, get_client_ip(request), False)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if department_name not in DEPARTMENT_INDEX:
        log_qr_scan(db, current_user.id, entry_id, department_name, get_client_ip(request), False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department")

    dept_index = DEPARTMENT_INDEX[department_name]

    if dept_index != entry.current_stage_index:
        log_qr_scan(db, current_user.id, entry_id, department_name, get_client_ip(request), False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This entry is currently at '{entry.current_department}'. Cannot scan for '{department_name}' yet."
        )

    existing_log = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry.id,
        DepartmentLog.department_index == dept_index
    ).first()

    if existing_log:
        log_qr_scan(db, current_user.id, entry_id, department_name, get_client_ip(request), False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This entry has already been received at this department"
        )

    new_log = DepartmentLog(
        entry_id=entry.id,
        department_name=department_name,
        department_index=dept_index,
        received_by_user_id=current_user.id,
        received_at=datetime.utcnow(),
        remarks=remarks,
        scan_method="upload"
    )

    db.add(new_log)

    if dept_index < len(DEPARTMENTS) - 1:
        entry.current_department = DEPARTMENTS[dept_index + 1]
        entry.current_stage_index = dept_index + 1
    else:
        entry.current_department = DEPARTMENTS[-1]
        entry.status = "Closed"

    entry.updated_at = datetime.utcnow()
    db.commit()

    log_qr_scan(db, current_user.id, entry_id, department_name, get_client_ip(request), True)

    return {
        "message": "QR uploaded and scanned successfully",
        "entry_id": entry.id,
        "department": department_name,
        "log_id": new_log.id
    }


@router.post("/decode")
async def decode_qr_text(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts raw QR text and returns the parsed entry_id + unique_id.
    Used as a backend fallback when the frontend can't parse the QR format.
    """
    import re
    raw = payload.get("text", "").strip()

    # Format 1: entry:1|uid:XXXX
    m = re.search(r'entry:(\d+)\|uid:(.+)', raw)
    if m:
        return {"entry_id": int(m.group(1)), "unique_id": m.group(2).strip()}

    # Format 2: entry:1:uid:XXXX
    m = re.search(r'entry:(\d+):uid:(.+)', raw)
    if m:
        return {"entry_id": int(m.group(1)), "unique_id": m.group(2).strip()}

    # Format 3: JSON
    try:
        import json
        parsed = json.loads(raw)
        if parsed.get("entry_id") and parsed.get("unique_id"):
            return {"entry_id": int(parsed["entry_id"]), "unique_id": parsed["unique_id"]}
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Cannot parse QR text. Raw content received: '{raw[:200]}'"
    )


@router.post("/regenerate/{entry_id}", response_model=QRCodeResponse)
async def regenerate_qr(
    entry_id: int,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db)
):
    """
    Re-generates QR code for an existing entry using the current correct format.
    Useful to fix entries that have old/broken QR data stored.
    """
    entry = db.query(PatrakEntry).filter(PatrakEntry.id == entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    qr_data = create_qr_data(entry.id, entry.unique_id, "scrb://")
    qr_image = generate_qr_code(qr_data)

    entry.qr_code_data = qr_image
    db.commit()

    return QRCodeResponse(
        entry_id=entry.id,
        unique_id=entry.unique_id,
        qr_image=qr_image
    )


@router.post("/receive-electronic")
async def receive_electronic(
    scan_data: QRScanRequest,
    current_user: User = Depends(require_not_viewer),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Digitally receives an electronic (Mails / Fax) patrak, logging the status movement
    without requiring a camera QR scan.
    """
    # Department users can only receive entries for their own department
    if current_user.role == UserRole.DEPARTMENT_USER.value:
        if current_user.department != scan_data.department_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You can only receive entries for your department ({current_user.department})"
            )

    entry = db.query(PatrakEntry).filter(PatrakEntry.id == scan_data.entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if entry.receiving_mode == "Physical":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Physical entries must be scanned using a physical QR Code."
        )

    if scan_data.department_name not in DEPARTMENT_INDEX:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department")

    dept_index = DEPARTMENT_INDEX[scan_data.department_name]

    if dept_index != entry.current_stage_index:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This entry is currently at '{entry.current_department}'. Cannot receive for '{scan_data.department_name}' yet."
        )

    existing_log = db.query(DepartmentLog).filter(
        DepartmentLog.entry_id == entry.id,
        DepartmentLog.department_index == dept_index
    ).first()

    if existing_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This entry has already been received at this department"
        )

    new_log = DepartmentLog(
        entry_id=entry.id,
        department_name=scan_data.department_name,
        department_index=dept_index,
        received_by_user_id=current_user.id,
        received_at=datetime.utcnow(),
        remarks=f"Digitally received via {entry.receiving_mode or 'Mails'}",
        scan_method="digital"
    )

    db.add(new_log)

    if dept_index < len(DEPARTMENTS) - 1:
        entry.current_department = DEPARTMENTS[dept_index + 1]
        entry.current_stage_index = dept_index + 1
    else:
        entry.current_department = DEPARTMENTS[-1]
        entry.status = "Closed"

    entry.updated_at = datetime.utcnow()
    db.commit()

    log_qr_scan(db, current_user.id, entry.id, scan_data.department_name, get_client_ip(request), True)

    return {
        "message": "Electronic patrak received successfully",
        "entry_id": entry.id,
        "department": scan_data.department_name,
        "log_id": new_log.id
    }