from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Project, TimeEntry, TimeEntryRead

router = APIRouter(tags=["time-entries"])


def _to_naive_utc(dt: datetime) -> datetime:
    """Normalize an incoming (possibly tz-aware) datetime to naive UTC to match
    how timestamps are stored."""
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _utc_iso(dt: datetime) -> str:
    """Render a stored naive-UTC datetime as an explicit UTC ISO string."""
    return dt.replace(tzinfo=timezone.utc).isoformat()


@router.get(
    "/api/projects/{project_id}/time-entries",
    response_model=list[TimeEntryRead],
)
def list_time_entries(
    project_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    session: Session = Depends(get_session),
):
    """Work sessions for a project, optionally bounded by [start, end) on the
    session's start time. Times are returned as UTC ISO strings; the client
    buckets them into local days for the calendar."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = select(TimeEntry).where(TimeEntry.project_id == project_id)
    if start is not None:
        query = query.where(TimeEntry.started_at >= _to_naive_utc(start))
    if end is not None:
        query = query.where(TimeEntry.started_at < _to_naive_utc(end))

    entries = session.exec(query.order_by(TimeEntry.started_at)).all()
    return [
        TimeEntryRead(
            id=e.id,
            task_id=e.task_id,
            seconds=e.seconds,
            started_at=_utc_iso(e.started_at),
            ended_at=_utc_iso(e.ended_at),
        )
        for e in entries
    ]
