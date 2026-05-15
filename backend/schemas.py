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

class MovementStatus(str, Enum):
    CREATED = "Created"
    FORWARDED = "Forwarded"
    RECEIVED = "Received"
    PENDING = "Pending"
    CLOSED = "Closed"

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
    sender_type: str = Field("Citizen", max_length=50)
    sender_name: Optional[str] = Field(None, max_length=100)
    sender_designation: Optional[str] = Field(None, max_length=100)
    sender_address: Optional[str] = None
    received_date: datetime
    priority: Priority = Priority.NORMAL
    description: Optional[str] = None
    receiving_mode: Optional[str] = "By Hand"
    sender_email: Optional[str] = None
    fax_number: Optional[str] = None
    unit_district: Optional[str] = None
    send_to: Optional[str] = None
    sender_reference_number: Optional[str] = None
    reference_date: Optional[datetime] = None

class PatrakEntryCreate(PatrakEntryBase):
    pass

class PatrakEntryUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=3, max_length=255)
    sender_type: Optional[str] = Field(None, max_length=50)
    sender_name: Optional[str] = Field(None, max_length=100)
    sender_designation: Optional[str] = Field(None, max_length=100)
    sender_address: Optional[str] = None
    received_date: Optional[datetime] = None
    priority: Optional[Priority] = None
    description: Optional[str] = None
    status: Optional[EntryStatus] = None
    receiving_mode: Optional[str] = None
    sender_email: Optional[str] = None
    fax_number: Optional[str] = None
    unit_district: Optional[str] = None
    send_to: Optional[str] = None
    sender_reference_number: Optional[str] = None
    reference_date: Optional[datetime] = None

class PatrakEntryResponse(PatrakEntryBase):
    id: int
    unique_id: str
    current_department: str
    status: EntryStatus
    qr_code_data: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    match_contexts: Optional[list[dict]] = None

    class Config:
        from_attributes = True

class PatrakMovementBase(BaseModel):
    entry_id: int
    to_department: str = Field(..., min_length=1)
    remarks: Optional[str] = None

class PatrakMovementCreate(PatrakMovementBase):
    pass

class PatrakMovementResponse(BaseModel):
    id: int
    entry_id: int
    from_department: Optional[str] = None
    to_department: str
    forwarded_by: int
    forwarded_by_name: Optional[str] = None
    timestamp: datetime
    remarks: Optional[str] = None
    status: MovementStatus

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

class ForwardRequest(BaseModel):
    entry_id: int
    to_department: str = Field(..., min_length=1)
    remarks: Optional[str] = None

class TrackingNode(BaseModel):
    from_department: Optional[str] = None
    to_department: str
    status: str
    timestamp: Optional[str] = None
    forwarded_by: Optional[str] = None
    remarks: Optional[str] = None

class TrackingResponse(BaseModel):
    entry: PatrakEntryResponse
    movements: List[PatrakMovementResponse]
    current_department: str
    total_movements: int

class PublicTrackingResponse(BaseModel):
    patrak_id: str
    subject: str
    current_status: str
    current_department: str
    sender_name: str
    sender_designation: Optional[str] = None
    priority: str
    total_movements: int
    movements: List[TrackingNode]

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
