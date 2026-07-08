from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sous_traitant import SousTraitant
from app.schemas.sous_traitant import SousTraitantCreate, SousTraitantUpdate, SousTraitantRead

router = APIRouter(prefix="/sous-traitants", tags=["sous-traitants"])

@router.get("/", response_model=list[SousTraitantRead])
def list_sous_traitants(db: Session = Depends(get_db)):
    return db.query(SousTraitant).all()

@router.get("/{sub_id}", response_model=SousTraitantRead)
def get_sous_traitant(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(SousTraitant).filter(SousTraitant.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sous-traitant introuvable")
    return sub

@router.post("/", response_model=SousTraitantRead, status_code=201)
def create_sous_traitant(data: SousTraitantCreate, db: Session = Depends(get_db)):
    sub = SousTraitant(**data.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.put("/{sub_id}", response_model=SousTraitantRead)
def update_sous_traitant(sub_id: int, data: SousTraitantUpdate, db: Session = Depends(get_db)):
    sub = db.query(SousTraitant).filter(SousTraitant.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sous-traitant introuvable")
    for key, value in data.model_dump().items():
        setattr(sub, key, value)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{sub_id}", status_code=204)
def delete_sous_traitant(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(SousTraitant).filter(SousTraitant.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Sous-traitant introuvable")
    db.delete(sub)
    db.commit()