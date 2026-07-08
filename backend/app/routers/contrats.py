from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contrat import Contrat
from app.schemas.contrat import ContratCreate, ContratUpdate, ContratRead

router = APIRouter(prefix="/contrats", tags=["contrats"])

@router.get("/", response_model=list[ContratRead])
def list_contrats(projet_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Contrat)
    if projet_id is not None:
        query = query.filter(Contrat.projet_id == projet_id)
    return query.all()

@router.get("/{contrat_id}", response_model=ContratRead)
def get_contrat(contrat_id: int, db: Session = Depends(get_db)):
    contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    return contrat

@router.post("/", response_model=ContratRead, status_code=201)
def create_contrat(data: ContratCreate, db: Session = Depends(get_db)):
    contrat = Contrat(**data.model_dump())
    db.add(contrat)
    db.commit()
    db.refresh(contrat)
    return contrat

@router.put("/{contrat_id}", response_model=ContratRead)
def update_contrat(contrat_id: int, data: ContratUpdate, db: Session = Depends(get_db)):
    contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    for key, value in data.model_dump().items():
        setattr(contrat, key, value)
    db.commit()
    db.refresh(contrat)
    return contrat

@router.delete("/{contrat_id}", status_code=204)
def delete_contrat(contrat_id: int, db: Session = Depends(get_db)):
    contrat = db.query(Contrat).filter(Contrat.id == contrat_id).first()
    if not contrat:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    db.delete(contrat)
    db.commit()