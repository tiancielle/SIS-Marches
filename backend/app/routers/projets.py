from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.projet import Projet
from app.schemas.projet import ProjetCreate, ProjetUpdate, ProjetRead

router = APIRouter(prefix="/projets", tags=["projets"])

@router.get("/", response_model=list[ProjetRead])
def list_projets(db: Session = Depends(get_db)):
    return db.query(Projet).all()

@router.get("/{projet_id}", response_model=ProjetRead)
def get_projet(projet_id: int, db: Session = Depends(get_db)):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return projet

@router.post("/", response_model=ProjetRead, status_code=201)
def create_projet(data: ProjetCreate, db: Session = Depends(get_db)):
    projet = Projet(**data.model_dump())
    db.add(projet)
    db.commit()
    db.refresh(projet)
    return projet

@router.put("/{projet_id}", response_model=ProjetRead)
def update_projet(projet_id: int, data: ProjetUpdate, db: Session = Depends(get_db)):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    for key, value in data.model_dump().items():
        setattr(projet, key, value)
    db.commit()
    db.refresh(projet)
    return projet

@router.delete("/{projet_id}", status_code=204)
def delete_projet(projet_id: int, db: Session = Depends(get_db)):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    db.delete(projet)
    db.commit()