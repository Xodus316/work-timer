from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Company, Project, ProjectCreate, ProjectRead, Task, TimeEntry

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _to_read(project: Project, company: Company | None) -> ProjectRead:
    return ProjectRead(
        id=project.id,
        name=project.name,
        company_id=project.company_id,
        company_name=company.name if company else "",
        created_at=project.created_at,
    )


@router.get("", response_model=list[ProjectRead])
def list_projects(session: Session = Depends(get_session)):
    rows = session.exec(
        select(Project, Company).join(Company).order_by(Project.created_at.desc())
    ).all()
    return [_to_read(project, company) for project, company in rows]


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    company = session.get(Company, project.company_id)
    return _to_read(project, company)


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(data: ProjectCreate, session: Session = Depends(get_session)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Project name is required")

    company = session.get(Company, data.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    project = Project(name=name, company_id=data.company_id)
    session.add(project)
    session.commit()
    session.refresh(project)
    return _to_read(project, company)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cascade: remove the project's time entries and tasks first
    # (FK enforcement is off for SQLite).
    for entry in session.exec(
        select(TimeEntry).where(TimeEntry.project_id == project_id)
    ).all():
        session.delete(entry)
    for task in session.exec(select(Task).where(Task.project_id == project_id)).all():
        session.delete(task)

    session.delete(project)
    session.commit()
