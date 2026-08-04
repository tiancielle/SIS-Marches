from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.projet import Projet
from app.models.analyse_dce import AnalyseDce
from app.models.historique_evenement import HistoriqueEvenement
from app.schemas.projet import ProjetCreate, ProjetUpdate, ProjetRead
from pydantic import BaseModel

router = APIRouter(prefix="/projets", tags=["projets"])


class StatutChangeRequest(BaseModel):
    nouveau_statut: str


def _to_projet_read(projet: Projet, db: Session) -> ProjetRead:
    """Convertit un ORM Projet en ProjetRead, en renseignant le flag calculé
    `a_analyse_dce` (True si une AnalyseDce existe pour l'AO d'origine)."""
    data = ProjetRead.model_validate(projet)
    if projet.appel_offres_id is not None:
        data.a_analyse_dce = db.query(AnalyseDce.id).filter(
            AnalyseDce.appel_offres_id == projet.appel_offres_id
        ).first() is not None
    return data


@router.get("/", response_model=list[ProjetRead])
def list_projets(db: Session = Depends(get_db)):
    return [_to_projet_read(p, db) for p in db.query(Projet).all()]


@router.get("/{projet_id}", response_model=ProjetRead)
def get_projet(projet_id: int, db: Session = Depends(get_db)):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return _to_projet_read(projet, db)


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


@router.post("/{projet_id}/changer-statut", response_model=ProjetRead)
def changer_statut_projet(
    projet_id: int, 
    data: StatutChangeRequest, 
    db: Session = Depends(get_db)
):
    """Change le statut d'un projet/opportunité et enregistre l'événement dans l'historique."""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    # Validation des transitions valides
    transitions_valides = {
        "interesse": ["en_preparation", "ignore", "abandonne"],
        "en_preparation": ["pret_a_deposer", "soumis", "ignore", "abandonne"],
        "pret_a_deposer": ["soumis", "en_preparation", "ignore", "abandonne"],
        "soumis": ["gagne", "perdu", "en_preparation"],
        "gagne": ["en_execution"],
        "en_execution": ["termine", "suspendu"],
        "perdu": [],
        "ignore": ["interesse"],
        "abandonne": ["interesse"],
        "suspendu": ["en_execution", "termine"],
        "termine": [],
    }
    
    ancien_statut = projet.statut
    nouveau_statut = data.nouveau_statut
    
    if nouveau_statut not in transitions_valides.get(ancien_statut, []):
        raise HTTPException(
            status_code=400, 
            detail=f"Transition invalide: {ancien_statut} → {nouveau_statut}"
        )
    
    # Mise à jour du statut
    projet.statut = nouveau_statut
    db.commit()
    db.refresh(projet)
    
    # Enregistrement automatique dans l'historique
    evenement = HistoriqueEvenement(
        projet_id=projet.id,
        type_evenement="statut_change",
        titre=f"Statut changé: {ancien_statut} → {nouveau_statut}",
        description=f"Le statut a été modifié de '{ancien_statut}' à '{nouveau_statut}'",
        ancien_statut=ancien_statut,
        nouveau_statut=nouveau_statut,
    )
    db.add(evenement)
    db.commit()
    
    return _to_projet_read(projet, db)


@router.get("/{projet_id}/historique", response_model=list)
def get_historique_projet(projet_id: int, db: Session = Depends(get_db)):
    """Récupère l'historique des événements d'un projet."""
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    
    evenements = db.query(HistoriqueEvenement).filter(
        HistoriqueEvenement.projet_id == projet_id
    ).order_by(HistoriqueEvenement.date_creation.desc()).all()
    
    return [
        {
            "id": e.id,
            "type_evenement": e.type_evenement,
            "titre": e.titre,
            "description": e.description,
            "ancien_statut": e.ancien_statut,
            "nouveau_statut": e.nouveau_statut,
            "donnees": e.donnees,
            "date_creation": e.date_creation.isoformat() if e.date_creation else None,
        }
        for e in evenements
    ]