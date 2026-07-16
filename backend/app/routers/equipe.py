from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.equipe import Equipe
from app.models.projet_equipe import ProjetEquipe
from app.schemas.equipe import (
    EquipeCreate, EquipeUpdate, EquipeRead,
    ProjetEquipeCreate, ProjetEquipeRead,
    ProjetEquipeDetailRead,
)

router = APIRouter(prefix="/equipe", tags=["equipe"])

# --- CRUD Equipe (les personnes) ---

@router.get("/", response_model=list[EquipeRead])
def list_equipe(projet_id: int | None = None, db: Session = Depends(get_db)):
    if projet_id is not None:
        # Jointure : uniquement les personnes affectées à ce projet
        return (
            db.query(Equipe)
            .join(ProjetEquipe, ProjetEquipe.equipe_id == Equipe.id)
            .filter(ProjetEquipe.projet_id == projet_id)
            .all()
        )
    return db.query(Equipe).all()

@router.get("/{equipe_id}", response_model=EquipeRead)
def get_equipe(equipe_id: int, db: Session = Depends(get_db)):
    person = db.query(Equipe).filter(Equipe.id == equipe_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Membre d'équipe introuvable")
    return person

@router.post("/", response_model=EquipeRead, status_code=201)
def create_equipe(data: EquipeCreate, db: Session = Depends(get_db)):
    person = Equipe(**data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person

@router.put("/{equipe_id}", response_model=EquipeRead)
def update_equipe(equipe_id: int, data: EquipeUpdate, db: Session = Depends(get_db)):
    person = db.query(Equipe).filter(Equipe.id == equipe_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Membre d'équipe introuvable")
    for key, value in data.model_dump().items():
        setattr(person, key, value)
    db.commit()
    db.refresh(person)
    return person

@router.delete("/{equipe_id}", status_code=204)
def delete_equipe(equipe_id: int, db: Session = Depends(get_db)):
    person = db.query(Equipe).filter(Equipe.id == equipe_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Membre d'équipe introuvable")
    db.delete(person)
    db.commit()


# --- Affectation projet <-> équipe (ProjetEquipe) ---

projet_equipe_router = APIRouter(prefix="/projet-equipe", tags=["projet-equipe"])

@projet_equipe_router.get("/", response_model=list[ProjetEquipeDetailRead])
def list_affectations(projet_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(ProjetEquipe, Equipe).join(Equipe, Equipe.id == ProjetEquipe.equipe_id)
    if projet_id is not None:
        query = query.filter(ProjetEquipe.projet_id == projet_id)
    return [
        {
            "id": pe.id, "projet_id": pe.projet_id, "equipe_id": pe.equipe_id, "role": pe.role,
            "nom": e.nom, "intitule": e.intitule, "type": e.type, "email": e.email, "phone": e.phone,
        }
        for pe, e in query.all()
    ]

@projet_equipe_router.post("/", response_model=ProjetEquipeRead, status_code=201)
def assign_equipe(data: ProjetEquipeCreate, db: Session = Depends(get_db)):
    affectation = ProjetEquipe(**data.model_dump())
    db.add(affectation)
    db.commit()
    db.refresh(affectation)
    return affectation

@projet_equipe_router.delete("/{affectation_id}", status_code=204)
def unassign_equipe(affectation_id: int, db: Session = Depends(get_db)):
    affectation = db.query(ProjetEquipe).filter(ProjetEquipe.id == affectation_id).first()
    if not affectation:
        raise HTTPException(status_code=404, detail="Affectation introuvable")
    db.delete(affectation)
    db.commit()