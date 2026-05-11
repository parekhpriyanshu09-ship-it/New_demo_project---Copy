import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_db import init_db, SessionLocal
from models import User, UserRole, DEPARTMENTS
from auth.utils import hash_password

def seed_users():
    init_db()
    db = SessionLocal()

    try:
        # Create admin user
        existing_admin = db.query(User).filter(User.username == "admin").first()

        if not existing_admin:
            admin_user = User(
                username="admin",
                email="admin@scrb.gujarat.gov.in",
                hashed_password=hash_password("Admin@SCRB2026!"),
                role=UserRole.ADMIN,
                department="Admin",
                is_active=True
            )
            db.add(admin_user)
            print("Admin user created successfully!")
            print("  Username: admin")
            print("  Password: Admin@SCRB2026!")
        else:
            print("Admin user already exists.")

        # Create department users for each of the 6 departments
        for dept in DEPARTMENTS:
            # Create username from department name (replace spaces with underscore)
            username = dept.lower().replace(" ", "_").replace("&", "and")

            existing_dept = db.query(User).filter(User.username == username).first()

            if not existing_dept:
                dept_user = User(
                    username=username,
                    email=f"{username}@scrb.gujarat.gov.in",
                    hashed_password=hash_password(f"{dept.replace(' ', '')}@2026!"),
                    role=UserRole.DEPARTMENT_USER,
                    department=dept,
                    is_active=True
                )
                db.add(dept_user)
                print(f"Department user '{username}' created for {dept}")
                print(f"  Password: {dept.replace(' ', '')}@2026!")
            else:
                print(f"Department user '{username}' already exists.")

        # Create a viewer account (read-only access)
        existing_viewer = db.query(User).filter(User.username == "viewer").first()

        if not existing_viewer:
            viewer_user = User(
                username="viewer",
                email="viewer@scrb.gujarat.gov.in",
                hashed_password=hash_password("Viewer@SCRB2026!"),
                role=UserRole.VIEWER,
                department="Viewer",
                is_active=True
            )
            db.add(viewer_user)
            print("\nViewer user created successfully!")
            print("  Username: viewer")
            print("  Password: Viewer@SCRB2026!")
            print("  Permissions: Read-only access")
        else:
            print("Viewer user already exists.")

        db.commit()
        print("\n" + "="*50)
        print("All users seeded successfully!")
        print("="*50)
        print("\nAccount Summary:")
        print("- Admin: Full access to all features")
        print("- Department Users: Can scan QR codes for their department")
        print("- Viewer: Read-only access")
        print("\nDepartment accounts created:")
        for dept in DEPARTMENTS:
            username = dept.lower().replace(" ", "_").replace("&", "and")
            print(f"  - {dept}: {username}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()