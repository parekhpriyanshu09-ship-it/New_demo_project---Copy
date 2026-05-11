from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    DG_OFFICE = "dg_office"
    DEPARTMENT_USER = "department_user"
    VIEWER = "viewer"

class Priority(str, Enum):
    NORMAL = "Normal"
    URGENT = "Urgent"
    CONFIDENTIAL = "Confidential"

class EntryStatus(str, Enum):
    ACTIVE = "Active"
    CLOSED = "Closed"
    ARCHIVED = "Archived"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.VIEWER

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class PatrakEntryBase(BaseModel):
    subject: str = Field(..., min_length=3, max_length=255)
    sender_name: str = Field(..., min_length=2, max_length=100)
    sender_designation: Optional[str] = Field(None, max_length=100)
    received_date: datetime
    priority: Priority = Priority.NORMAL
    description: Optional[str] = None
    receiving_mode: Optional[str] = "Physical"
    sender_email: Optional[str] = None
    fax_number: Optional[str] = None

class PatrakEntryCreate(PatrakEntryBase):
    pass

class PatrakEntryUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=3, max_length=255)
    sender_name: Optional[str] = Field(None, min_length=2, max_length=100)
    sender_designation: Optional[str] = Field(None, max_length=100)
    received_date: Optional[datetime] = None
    priority: Optional[Priority] = None
    description: Optional[str] = None
    status: Optional[EntryStatus] = None
    receiving_mode: Optional[str] = None
    sender_email: Optional[str] = None
    fax_number: Optional[str] = None

class PatrakEntryResponse(PatrakEntryBase):
    id: int
    unique_id: str
    current_department: str
    current_stage_index: int
    status: EntryStatus
    qr_code_data: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DepartmentLogBase(BaseModel):
    remarks: Optional[str] = None
    scan_method: str = "camera"

class DepartmentLogCreate(DepartmentLogBase):
    entry_id: int

class DepartmentLogResponse(DepartmentLogBase):
    id: int
    entry_id: int
    department_name: str
    department_index: int
    received_by_user_id: int
    received_at: datetime

    class Config:
        from_attributes = True

class QRCodeResponse(BaseModel):
    entry_id: int
    unique_id: str
    qr_image: str

class QRScanRequest(BaseModel):
    entry_id: int
    department_name: str

class QRUploadRequest(BaseModel):
    entry_id: int
    department_name: str

class TrackingResponse(BaseModel):
    entry: PatrakEntryResponse
    logs: List[DepartmentLogResponse]
    timeline: List[dict]

class DashboardStats(BaseModel):
    total_entries: int
    active_entries: int
    closed_entries: int
    department_counts: dict

class CalendarResponse(BaseModel):
    month: int
    year: int
    dates: List[dict]

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime
    details: Optional[str]

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    per_page: int
    pages: int