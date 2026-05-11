from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from main_db import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DG_OFFICE = "dg_office"
    DEPARTMENT_USER = "department_user"
    VIEWER = "viewer"

class Priority(str, enum.Enum):
    NORMAL = "Normal"
    URGENT = "Urgent"
    CONFIDENTIAL = "Confidential"

class EntryStatus(str, enum.Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"
    ARCHIVED = "Archived"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, default=0)
    lockout_until = Column(DateTime, nullable=True)

    entries_created = relationship("PatrakEntry", back_populates="creator")
    logs_received = relationship("DepartmentLog", back_populates="received_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")

class PatrakEntry(Base):
    __tablename__ = "patrak_entries"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(36), unique=True, index=True, nullable=False)
    subject = Column(String(255), nullable=False)
    sender_name = Column(String(100), nullable=False)
    sender_designation = Column(String(100), nullable=True)
    received_date = Column(DateTime, nullable=False)
    priority = Column(SQLEnum(Priority), default=Priority.NORMAL)
    description = Column(Text, nullable=True)
    receiving_mode = Column(String(20), nullable=False, default="Physical")
    sender_email = Column(String(100), nullable=True)
    fax_number = Column(String(50), nullable=True)
    current_department = Column(String(100), nullable=False, default="DG Office")
    current_stage_index = Column(Integer, default=0)
    status = Column(SQLEnum(EntryStatus), default=EntryStatus.ACTIVE)
    qr_code_data = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="entries_created")
    logs = relationship("DepartmentLog", back_populates="entry", order_by="DepartmentLog.received_at")

class DepartmentLog(Base):
    __tablename__ = "department_logs"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("patrak_entries.id"), nullable=False)
    department_name = Column(String(100), nullable=False)
    department_index = Column(Integer, nullable=False)
    received_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text, nullable=True)
    scan_method = Column(String(20), default="camera")

    entry = relationship("PatrakEntry", back_populates="logs")
    received_by_user = relationship("User", back_populates="logs_received")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_logs")

DEPARTMENTS = [
    "DG Office",
    "CID Crime",
    "Law & Order",
    "Training",
    "TS & SCRB"
]

DEPARTMENT_INDEX = {name: idx for idx, name in enumerate(DEPARTMENTS)}