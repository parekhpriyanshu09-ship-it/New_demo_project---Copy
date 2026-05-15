from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from database import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import models
    Base.metadata.create_all(bind=engine)

    # Automatic SQLite migration for new schema
    import sqlite3
    from database import settings
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get existing columns for patrak_entries
            cursor.execute("PRAGMA table_info(patrak_entries)")
            patrak_columns = [col[1] for col in cursor.fetchall()]
            
            # Add missing columns to patrak_entries
            migrations_patrak = []
            if "receiving_mode" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN receiving_mode VARCHAR(20) DEFAULT 'By Hand'")
                migrations_patrak.append("receiving_mode")
            if "sender_email" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN sender_email VARCHAR(100) NULL")
                migrations_patrak.append("sender_email")
            if "fax_number" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN fax_number VARCHAR(50) NULL")
                migrations_patrak.append("fax_number")
            if "unit_district" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN unit_district VARCHAR(100) NULL")
                migrations_patrak.append("unit_district")
            if "send_to" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN send_to VARCHAR(100) NULL")
                migrations_patrak.append("send_to")
            if "sender_type" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN sender_type VARCHAR(50) DEFAULT 'Citizen'")
                migrations_patrak.append("sender_type")
            if "sender_address" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN sender_address TEXT NULL")
                migrations_patrak.append("sender_address")
            if "sender_reference_number" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN sender_reference_number VARCHAR(100) NULL")
                migrations_patrak.append("sender_reference_number")
            if "reference_date" not in patrak_columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN reference_date DATETIME NULL")
                migrations_patrak.append("reference_date")
            
            for col in migrations_patrak:
                print(f"Migration: Added column {col} to patrak_entries table")
            
            # Check if patrak_movements table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='patrak_movements'")
            if not cursor.fetchone():
                # Create patrak_movements table
                cursor.execute("""
                    CREATE TABLE patrak_movements (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        entry_id INTEGER NOT NULL,
                        from_department VARCHAR(100),
                        to_department VARCHAR(100) NOT NULL,
                        forwarded_by INTEGER NOT NULL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                        remarks TEXT,
                        status VARCHAR(20) DEFAULT 'Forwarded',
                        FOREIGN KEY (entry_id) REFERENCES patrak_entries (id),
                        FOREIGN KEY (forwarded_by) REFERENCES users (id)
                    )
                """)
                print("Migration: Created patrak_movements table")
                
                # Also need to add user relationship for movements if users table exists
                cursor.execute("PRAGMA table_info(users)")
                user_columns = [col[1] for col in cursor.fetchall()]
                if "movements" not in user_columns:
                    try:
                        cursor.execute("ALTER TABLE users ADD COLUMN movements INTEGER DEFAULT 0")
                        print("Migration: Added movements column to users table")
                    except:
                        pass
            else:
                # Check for missing columns in patrak_movements
                cursor.execute("PRAGMA table_info(patrak_movements)")
                movement_columns = [col[1] for col in cursor.fetchall()]
                
                movement_migrations = []
                if "from_department" not in movement_columns:
                    cursor.execute("ALTER TABLE patrak_movements ADD COLUMN from_department VARCHAR(100) NULL")
                    movement_migrations.append("from_department")
                if "to_department" not in movement_columns:
                    cursor.execute("ALTER TABLE patrak_movements ADD COLUMN to_department VARCHAR(100) NOT NULL")
                    movement_migrations.append("to_department")
                if "status" not in movement_columns:
                    cursor.execute("ALTER TABLE patrak_movements ADD COLUMN status VARCHAR(20) DEFAULT 'Forwarded'")
                    movement_migrations.append("status")
                
                for col in movement_migrations:
                    print(f"Migration: Added column {col} to patrak_movements table")
            
            conn.commit()
            conn.close()
            
            if migrations_patrak or True:
                print("Database migration completed successfully")
                
        except Exception as e:
            print(f"Migration error: {e}")
