from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Project, Task, TaskCreate, TaskRead, TaskUpdate, utcnow

router = APIRouter(tags=["tasks"])


def _commit_running(task: Task) -> None:
    """Fold any in-progress running time into total_seconds and stop the task."""
    if task.running_since is not None:
        delta = int((utcnow() - task.running_since).total_seconds())
        if delta > 0:
            task.total_seconds += delta
        task.running_since = None


def _to_read(task: Task) -> TaskRead:
    """Serialize a task with a server-computed live elapsed total."""
    elapsed = task.total_seconds
    running = task.running_since is not None
    if running:
        delta = int((utcnow() - task.running_since).total_seconds())
        if delta > 0:
            elapsed += delta
    return TaskRead(
        id=task.id,
        project_id=task.project_id,
        name=task.name,
        description=task.description,
        total_seconds=task.total_seconds,
        elapsed_seconds=elapsed,
        is_running=running,
        completed=task.completed,
        created_at=task.created_at,
    )


def _get_task_or_404(task_id: int, session: Session) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/api/tasks/running", response_model=Optional[TaskRead])
def get_running_task(session: Session = Depends(get_session)):
    """The single task with a live timer, or null when nothing is running."""
    task = session.exec(select(Task).where(Task.running_since.is_not(None))).first()
    return _to_read(task) if task else None


@router.get("/api/projects/{project_id}/tasks", response_model=list[TaskRead])
def list_tasks(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    tasks = session.exec(
        select(Task).where(Task.project_id == project_id).order_by(Task.created_at)
    ).all()
    return [_to_read(task) for task in tasks]


@router.post("/api/projects/{project_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(project_id: int, data: TaskCreate, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Task name is required")

    description = (data.description or "").strip() or None
    task = Task(project_id=project_id, name=name, description=description)
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_read(task)


@router.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, data: TaskUpdate, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)

    if data.name is not None:
        new_name = data.name.strip()
        if not new_name:
            raise HTTPException(status_code=422, detail="Task name cannot be empty")
        task.name = new_name

    if data.description is not None:
        task.description = data.description.strip() or None

    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_read(task)


@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)
    session.delete(task)
    session.commit()


@router.post("/api/tasks/{task_id}/start", response_model=TaskRead)
def start_task(task_id: int, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)

    if task.completed:
        raise HTTPException(
            status_code=409,
            detail="Task is completed. Add more time to it first.",
        )

    # Single-timer rule: stop any other task that's currently running.
    running = session.exec(select(Task).where(Task.running_since.is_not(None))).all()
    for other in running:
        if other.id != task.id:
            _commit_running(other)
            session.add(other)

    if task.running_since is None:
        task.running_since = utcnow()
        session.add(task)

    session.commit()
    session.refresh(task)
    return _to_read(task)


@router.post("/api/tasks/{task_id}/stop", response_model=TaskRead)
def stop_task(task_id: int, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)
    _commit_running(task)
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_read(task)


@router.post("/api/tasks/{task_id}/complete", response_model=TaskRead)
def complete_task(task_id: int, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)
    # Stop the timer first so any in-progress time is recorded, then mark complete.
    _commit_running(task)
    task.completed = True
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_read(task)


@router.post("/api/tasks/{task_id}/reopen", response_model=TaskRead)
def reopen_task(task_id: int, session: Session = Depends(get_session)):
    task = _get_task_or_404(task_id, session)
    task.completed = False
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_read(task)
