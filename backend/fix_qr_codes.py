"""
One-time script: Regenerates QR codes for ALL existing entries
that have the old broken Python dict format in their qr_code_data.

Run from backend directory with venv activated:
    python fix_qr_codes.py
"""
import sys
import os

# Make sure we can import from the backend
sys.path.insert(0, os.path.dirname(__file__))

from main_db import SessionLocal
from models import PatrakEntry
from utils.qr_generator import generate_qr_code, create_qr_data

def fix_all_qr_codes():
    db = SessionLocal()
    try:
        entries = db.query(PatrakEntry).all()
        fixed = 0
        skipped = 0

        for entry in entries:
            # Check if the stored QR is the old Python dict format
            # (it won't have "entry:" prefix if it's the old format, or it's None)
            needs_fix = False
            if not entry.qr_code_data:
                needs_fix = True
                print(f"  Entry {entry.id} ({entry.unique_id}): No QR data - will generate")
            else:
                # Old format QR codes encode Python dict strings like {'entry_id': 10, ...}
                # New format encodes "entry:10|uid:..." 
                # We can't easily check the encoded image, so regenerate all of them
                needs_fix = True

            if needs_fix:
                qr_data = create_qr_data(entry.id, entry.unique_id, "scrb://")
                entry.qr_code_data = generate_qr_code(qr_data)
                fixed += 1
                print(f"  [OK] Fixed Entry {entry.id}: entry:{entry.id}|uid:{entry.unique_id}")
            else:
                skipped += 1

        db.commit()
        print(f"\n[DONE] Fixed {fixed} entries, skipped {skipped}.")
        print("Now re-download QR codes from Letter Details page and scan them.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Fixing QR codes for all existing entries...\n")
    fix_all_qr_codes()
