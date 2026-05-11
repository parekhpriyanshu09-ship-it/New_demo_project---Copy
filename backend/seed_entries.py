import os
import sys
import uuid
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_db import init_db, SessionLocal
from models import PatrakEntry, User, Priority, EntryStatus, DepartmentLog, DEPARTMENTS

SAMPLE_ENTRIES = [
    {
        "subject": "Urgent: Crime Branch Report on Recent Thefts",
        "sender_name": "Rajesh Kumar",
        "sender_designation": "Inspector, Crime Branch",
        "priority": Priority.URGENT,
        "description": "Detailed report on chain snatching incidents in zone 3.",
    },
    {
        "subject": "Monthly Training Schedule for New Recruits",
        "sender_name": "Amit Sharma",
        "sender_designation": "SP Training",
        "priority": Priority.NORMAL,
        "description": "Training calendar for upcoming batch starting May 2026.",
    },
    {
        "subject": "TS & SCRB: Annual Statistics Compilation",
        "sender_name": "Mohan Rao",
        "sender_designation": "Director SCRB",
        "priority": Priority.NORMAL,
        "description": "Year-end crime statistics report for 2025-2026.",
    },
    {
        "subject": "CID: Money Laundering Investigation Update",
        "sender_name": "Priya Mehta",
        "sender_designation": "ACP CID",
        "priority": Priority.URGENT,
        "description": "Update on ongoing investigation Case No. 2026/CR/451.",
    },
    {
        "subject": "Training Material Request for Cyber Crime Module",
        "sender_name": "Deepak Joshi",
        "sender_designation": "Instructor",
        "priority": Priority.NORMAL,
        "description": "Request for updated cyber crime investigation manuals.",
    },
]

def seed_entries():
    init_db()
    db = SessionLocal()

    try:
        # Get admin user for created_by
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found. Please run seed.py first.")
            return

        # Check if entries already exist
        existing_count = db.query(PatrakEntry).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} entries. Skipping...")
            return

        # Create entries with different statuses and stages
        statuses = [EntryStatus.ACTIVE, EntryStatus.ACTIVE, EntryStatus.ACTIVE, EntryStatus.CLOSED]
        stages = [0, 1, 2, 3, 4]  # DG Office, CID Crime, Law & Order, Training, TS & SCRB

        for i, entry_data in enumerate(SAMPLE_ENTRIES):
            unique_id = str(uuid.uuid4())[:8].upper()
            status = statuses[i % len(statuses)]
            current_stage = stages[i % len(stages)]

            entry = PatrakEntry(
                unique_id=f"SCRB-{unique_id}",
                subject=entry_data["subject"],
                sender_name=entry_data["sender_name"],
                sender_designation=entry_data["sender_designation"],
                received_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                priority=entry_data["priority"],
                description=entry_data["description"],
                current_department=DEPARTMENTS[current_stage],
                current_stage_index=current_stage,
                status=status,
                created_by=admin_user.id,
            )

            db.add(entry)
            db.flush()  # Get the entry ID

            # Create department logs for entries that have been processed
            if current_stage > 0:
                for stage_idx in range(current_stage):
                    log = DepartmentLog(
                        entry_id=entry.id,
                        department_name=DEPARTMENTS[stage_idx],
                        department_index=stage_idx,
                        received_by_user_id=admin_user.id,
                        received_at=datetime.utcnow() - timedelta(days=random.randint(1, 20)),
                        remarks=f"Received and processed at {DEPARTMENTS[stage_idx]}",
                        scan_method="camera" if stage_idx % 2 == 0 else "upload"
                    )
                    db.add(log)

            # Close completed entries
            if status == EntryStatus.CLOSED:
                entry.status = EntryStatus.CLOSED
                entry.current_department = DEPARTMENTS[-1]
                entry.current_stage_index = len(DEPARTMENTS) - 1

        db.commit()
        print(f"Successfully created {len(SAMPLE_ENTRIES)} demo patrak entries!")

        # Print summary
        total = db.query(PatrakEntry).count()
        active = db.query(PatrakEntry).filter(PatrakEntry.status == EntryStatus.ACTIVE).count()
        closed = db.query(PatrakEntry).filter(PatrakEntry.status == EntryStatus.CLOSED).count()
        print(f"\nDatabase Summary:")
        print(f"  Total Entries: {total}")
        print(f"  Active: {active}")
        print(f"  Closed: {closed}")

    except Exception as e:
        print(f"Error creating entries: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_entries()
