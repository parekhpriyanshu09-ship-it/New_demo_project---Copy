from sqlalchemy.orm import Session
from models import AuditLog
from datetime import datetime

def log_action(
    db: Session,
    user_id: int | None,
    action: str,
    resource: str | None = None,
    ip_address: str | None = None,
    details: str | None = None
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        ip_address=ip_address,
        timestamp=datetime.utcnow(),
        details=details
    )
    db.add(audit_log)
    db.commit()
    return audit_log

def log_login(db: Session, user_id: int, ip_address: str | None = None, success: bool = True):
    action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
    details = "Successful login" if success else "Failed login attempt"
    return log_action(db, user_id if success else None, action, "auth", ip_address, details)

def log_logout(db: Session, user_id: int, ip_address: str | None = None):
    return log_action(db, user_id, "LOGOUT", "auth", ip_address, "User logged out")

def log_entry_created(db: Session, user_id: int, entry_id: int, ip_address: str | None = None):
    return log_action(db, user_id, "ENTRY_CREATED", "entries", ip_address, f"Entry ID: {entry_id}")

def log_entry_updated(db: Session, user_id: int, entry_id: int, ip_address: str | None = None):
    return log_action(db, user_id, "ENTRY_UPDATED", "entries", ip_address, f"Entry ID: {entry_id}")

def log_entry_deleted(db: Session, user_id: int, entry_id: int, ip_address: str | None = None):
    return log_action(db, user_id, "ENTRY_DELETED", "entries", ip_address, f"Entry ID: {entry_id}")

def log_qr_scan(db: Session, user_id: int, entry_id: int, department: str,
                ip_address: str | None = None, success: bool = True):
    action = "QR_SCAN_SUCCESS" if success else "QR_SCAN_FAILED"
    details = f"Entry ID: {entry_id}, Department: {department}"
    return log_action(db, user_id, action, "qr", ip_address, details)

def log_user_created(db: Session, admin_id: int, user_id: int, ip_address: str | None = None):
    return log_action(db, admin_id, "USER_CREATED", "admin", ip_address, f"User ID: {user_id}")

def log_user_updated(db: Session, admin_id: int, user_id: int, ip_address: str | None = None):
    return log_action(db, admin_id, "USER_UPDATED", "admin", ip_address, f"User ID: {user_id}")

def log_user_deleted(db: Session, admin_id: int, user_id: int, ip_address: str | None = None):
    return log_action(db, admin_id, "USER_DELETED", "admin", ip_address, f"User ID: {user_id}")