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

    # Automatic SQLite migration to add receiving_mode, sender_email, and fax_number columns if missing
    import sqlite3
    from database import settings
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(patrak_entries)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if "receiving_mode" not in columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN receiving_mode VARCHAR(20) DEFAULT 'Physical'")
                print("Migration: Added column receiving_mode to patrak_entries table")
            if "sender_email" not in columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN sender_email VARCHAR(100) NULL")
                print("Migration: Added column sender_email to patrak_entries table")
            if "fax_number" not in columns:
                cursor.execute("ALTER TABLE patrak_entries ADD COLUMN fax_number VARCHAR(50) NULL")
                print("Migration: Added column fax_number to patrak_entries table")
                
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Migration error: {e}")