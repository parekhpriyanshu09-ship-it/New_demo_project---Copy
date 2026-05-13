import os
import sys
import uuid
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_db import init_db, SessionLocal
from models import PatrakEntry, User, Priority, EntryStatus, PatrakMovement, MovementStatus, DEPARTMENTS

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
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found. Please run seed.py first.")
            return

        existing_count = db.query(PatrakEntry).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} entries. Skipping...")
            return

        statuses = [EntryStatus.ACTIVE, EntryStatus.ACTIVE, EntryStatus.ACTIVE, EntryStatus.CLOSED]

        for i, entry_data in enumerate(SAMPLE_ENTRIES):
            unique_id = str(uuid.uuid4())[:8].upper()
            status = statuses[i % len(statuses)]
            
            initial_dept = DEPARTMENTS[0]

            entry = PatrakEntry(
                unique_id=f"PTRK-{datetime.now().strftime('%Y%m%d')}-{unique_id}",
                subject=entry_data["subject"],
                sender_name=entry_data["sender_name"],
                sender_designation=entry_data["sender_designation"],
                received_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                priority=entry_data["priority"],
                description=entry_data["description"],
                current_department=initial_dept,
                status=status,
                created_by=admin_user.id,
            )

            db.add(entry)
            db.flush()

            creation_movement = PatrakMovement(
                entry_id=entry.id,
                from_department=None,
                to_department=initial_dept,
                forwarded_by=admin_user.id,
                timestamp=datetime.utcnow() - timedelta(days=random.randint(20, 25)),
                remarks=f"Entry created and registered",
                status=MovementStatus.CREATED
            )
            db.add(creation_movement)

            if status == EntryStatus.CLOSED:
                entry.status = EntryStatus.CLOSED

        db.commit()
        print(f"Successfully created {len(SAMPLE_ENTRIES)} demo patrak entries!")

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
