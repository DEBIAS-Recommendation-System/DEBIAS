from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
from app.core.config import settings


DATABASE_URL = f"postgresql://{settings.db_username}:{settings.db_password}@{settings.db_hostname}:{settings.db_port}/{settings.db_name}"

# Establish a connection to the PostgreSQL database
engine = create_engine(DATABASE_URL)


# Create database tables based on the defined SQLAlchemy models (subclasses of the Base class)
Base = declarative_base()

# Import models after Base declaration so metadata is populated before creating tables
def _ensure_tables_exist() -> None:
    import app.models.models  # noqa: F401 - imported for side effects

    Base.metadata.create_all(bind=engine)


_ensure_tables_exist()


# Connect to the database and provide a session for interacting with it
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
