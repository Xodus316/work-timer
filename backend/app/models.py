from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    """Naive UTC timestamp, stored consistently so SQLite comparisons are clean."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# --- Company ---------------------------------------------------------------
class CompanyBase(SQLModel):
    name: str = Field(index=True)


class Company(CompanyBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: int


# --- Project ---------------------------------------------------------------
class ProjectBase(SQLModel):
    name: str
    company_id: int = Field(foreign_key="company.id", index=True)


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=utcnow)


class ProjectCreate(ProjectBase):
    pass


class ProjectRead(SQLModel):
    id: int
    name: str
    company_id: int
    company_name: str
    created_at: datetime


# --- Task ------------------------------------------------------------------
class TaskBase(SQLModel):
    name: str
    description: Optional[str] = None


class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    total_seconds: int = Field(default=0)
    running_since: Optional[datetime] = Field(default=None)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utcnow)


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TaskRead(SQLModel):
    id: int
    project_id: int
    name: str
    description: Optional[str]
    total_seconds: int
    elapsed_seconds: int
    is_running: bool
    completed: bool
    created_at: datetime
