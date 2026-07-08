from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.dce import DCE
from app.schemas.dce import DCECreate, DCEUpdate, DCERead

router = APIRouter(prefix="/dce", tags=["dce"])

@router.get("/", response_model=list[DCERead])
def list_dce(projet_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(DCE)
    if projet_id is not None:
        query = query.filter(DCE.projet_id == projet_id)
    return query.all()

@router.get("/{dce_id}", response_model=DCERead)
def get_dce(dce_id: int, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    return dce

@router.post("/", response_model=DCERead, status_code=201)
def create_dce(data: DCECreate, db: Session = Depends(get_db)):
    existing = db.query(DCE).filter(DCE.projet_id == data.projet_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ce projet a déjà un DCE (relation 1:1)")
    dce = DCE(**data.model_dump())
    db.add(dce)
    db.commit()
    db.refresh(dce)
    return dce

@router.put("/{dce_id}", response_model=DCERead)
def update_dce(dce_id: int, data: DCEUpdate, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    for key, value in data.model_dump().items():
        setattr(dce, key, value)
    db.commit()
    db.refresh(dce)
    return dce

@router.delete("/{dce_id}", status_code=204)
def delete_dce(dce_id: int, db: Session = Depends(get_db)):
    dce = db.query(DCE).filter(DCE.id == dce_id).first()
    if not dce:
        raise HTTPException(status_code=404, detail="DCE introuvable")
    db.delete(dce)
    db.commit()