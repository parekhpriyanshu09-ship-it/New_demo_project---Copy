from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from main_db import get_db
from models import User, PatrakEntry, UserRole, DEPARTMENTS
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
    """
    Legacy QR scan endpoint - for backward compatibility.
    For new dynamic forwarding, use the /api/forward endpoint instead.
    """
    if current_user.role == UserRole.DEPARTMENT_USER.value:
        if current_user.department != scan_data.department_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You can only scan entries for your department ({current_user.department})"
            )

    entry = db.query(PatrakEntry).filter(PatrakEntry.id == scan_data.entry_id).first()

    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if scan_data.department_name not in DEPARTMENTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department")

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="QR scanning is deprecated. Please use the dynamic forwarding system (/api/forward) instead."
    )


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
    """
    Legacy QR upload scan - for backward compatibility.
    For new dynamic forwarding, use the /api/forward endpoint instead.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="QR upload scanning is deprecated. Please use the dynamic forwarding system (/api/forward) instead."
    )


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
    Deprecated: Digitally receives an electronic (Mails / Fax) patrak.
    Use /api/forward instead for dynamic forwarding.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Electronic receiving is deprecated. Please use the dynamic forwarding system (/api/forward) instead."
    )
