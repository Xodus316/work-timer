from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Company, CompanyCreate, CompanyRead, Project

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[CompanyRead])
def list_companies(session: Session = Depends(get_session)):
    return session.exec(select(Company).order_by(Company.name)).all()


@router.post("", response_model=CompanyRead, status_code=201)
def create_company(data: CompanyCreate, session: Session = Depends(get_session)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Company name is required")

    existing = session.exec(select(Company).where(Company.name == name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="A company with that name already exists")

    company = Company(name=name)
    session.add(company)
    session.commit()
    session.refresh(company)
    return company


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int, session: Session = Depends(get_session)):
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    in_use = session.exec(select(Project).where(Project.company_id == company_id)).first()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a company that still has projects",
        )

    session.delete(company)
    session.commit()
