import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_db import SessionLocal
from models import PatrakEntry

def update_modes():
    db = SessionLocal()
    try:
        entries = db.query(PatrakEntry).all()
        if not entries:
            print("No entries found in database. Please seed some first.")
            return

        print(f"Found {len(entries)} entries. Updating receiving modes...")
        
        # We want to distribute them: e.g. 50% Physical, 30% Mails, 20% Fax
        # Let's assign them systematically so we get exactly some of each!
        modes_cycle = ["Physical", "Mails", "Fax", "Physical", "Mails"]
        
        for idx, entry in enumerate(entries):
            assigned_mode = modes_cycle[idx % len(modes_cycle)]
            entry.receiving_mode = assigned_mode
            print(f"  Entry {entry.id} ({entry.unique_id}) -> {assigned_mode}")
            
        db.commit()
        print("Successfully updated receiving modes!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_modes()
