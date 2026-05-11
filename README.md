# SCRB Gujarat Police - Patrak (Courier/Letter) Tracking System

A secure, role-based internal government courier/letter tracking system for Gujarat Police - SCRB (State Crime Records Bureau).

## Features

- **JWT Authentication** with access/refresh token rotation
- **Role-Based Access Control** (Admin, DG Office, Department User, Viewer)
- **QR Code Generation & Scanning** for tracking entries
- **Real-time Dashboard** with statistics, calendar, and activity feed
- **Complete Audit Logging** for all sensitive actions
- **OWASP Top 10 2021 Compliance** with security headers and rate limiting

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + Recharts
- **Backend**: Python FastAPI + SQLAlchemy + SQLite
- **Authentication**: JWT with HTTP-only cookies

## Project Structure

```
SCRB_Gujarat_Police/
├── backend/
│   ├── auth/           # Authentication module
│   │   ├── router.py
│   │   ├── utils.py
│   │   └── dependencies.py
│   ├── middleware/     # Security & rate limiting
│   │   ├── security.py
│   │   └── rate_limit.py
│   ├── routers/        # API endpoints
│   │   ├── entries.py
│   │   ├── logs.py
│   │   ├── qr.py
│   │   ├── dashboard.py
│   │   └── admin.py
│   ├── utils/          # Utilities
│   │   ├── qr_generator.py
│   │   └── audit.py
│   ├── main.py         # FastAPI application
│   ├── database.py     # Database configuration
│   ├── models.py       # SQLAlchemy models
│   ├── schemas.py      # Pydantic schemas
│   ├── seed.py         # Seed script for admin
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/    # Auth context
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API service
│   │   └── utils/       # Utilities
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .env.example
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   copy .env.example .env
   ```

5. **Initialize database and create admin user:**
   ```bash
   python seed.py
   ```

6. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   Or directly:
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Default Credentials

| Role  | Username | Password        |
|-------|----------|-----------------|
| Admin | admin    | Admin@SCRB2026! |

## User Roles

| Role            | Permissions                                           |
|-----------------|------------------------------------------------------|
| Admin           | Full access - create, edit, delete, scan, manage users |
| DG Office       | Create entries, generate/scan QR, view DG Office logs  |
| Department User | Scan QR codes, view own department logs               |
| Viewer          | Read-only access to entries and tracking status       |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Viewer role only)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Entries
- `GET /api/entries` - List entries (paginated, filterable)
- `POST /api/entries` - Create entry (Admin + DG Office)
- `GET /api/entries/{id}` - Get entry details
- `PUT /api/entries/{id}` - Update entry (Admin only)
- `DELETE /api/entries/{id}` - Delete entry (Admin only)
- `GET /api/entries/{id}/tracking` - Get tracking timeline

### QR Code
- `GET /api/qr/generate/{entry_id}` - Generate QR code
- `POST /api/qr/scan` - Scan QR code
- `POST /api/qr/upload-scan` - Upload QR image to scan

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/calendar` - Calendar data
- `GET /api/dashboard/department-counts` - Department counts
- `GET /api/dashboard/date-chart` - Date chart data
- `GET /api/dashboard/recent-activity` - Recent activity

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/audit-logs` - View audit logs

## Departments (in order of flow)

1. DG Office (Entry point)
2. CID Crime
3. Law & Order
4. Training
5. IB
6. TS & SCRB

## Security Features

- **Rate Limiting**: 5 failed login attempts = 15 min lockout
- **JWT Tokens**: Access (30 min) + Refresh (7 days) with rotation
- **HTTP-only Cookies**: Secure token storage
- **Security Headers**: CSP, X-Frame-Options, HSTS, etc.
- **BCrypt Password Hashing**: Cost factor 12
- **Audit Logging**: All sensitive actions logged

## License

This project is for official use by Gujarat Police - SCRB only.