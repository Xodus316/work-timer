import os
from pathlib import Path

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/work_timer.db")

# SQLite needs check_same_thread=False because FastAPI serves requests across threads.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    """Create the SQLite parent directory (if needed) and all tables."""
    if DATABASE_URL.startswith("sqlite:///"):
        db_path = DATABASE_URL.replace("sqlite:///", "", 1)
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    # Import models so their tables are registered on SQLModel.metadata.
    from . import models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    _run_migrations()


def _run_migrations() -> None:
    """Lightweight, idempotent column additions for tables that already exist."""
    inspector = inspect(engine)
    if "task" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("task")}
    if "completed" not in columns:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE task ADD COLUMN completed BOOLEAN NOT NULL DEFAULT 0")
            )


def get_session():
    with Session(engine) as session:
        yield session
