import os
import shutil

from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.piece_dossier import PieceDossier
from app.models.projet import Projet
from app.schemas.piece_dossier import PieceDossierRead, PieceDossierUpdate

router = APIRouter(prefix="/projets/{projet_id}/pieces-dossier", tags=["pieces-dossier"])


def _get_projet_or_404(projet_id: int, db: Session) -> Projet:
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return projet


def _get_piece_or_404(projet_id: int, piece_id: int, db: Session) -> PieceDossier:
    piece = db.query(PieceDossier).filter(
        PieceDossier.id == piece_id, PieceDossier.projet_id == projet_id
    ).first()
    if not piece:
        raise HTTPException(status_code=404, detail="Pièce introuvable pour ce projet")
    return piece


@router.get("/", response_model=list[PieceDossierRead])
def list_pieces(projet_id: int, db: Session = Depends(get_db)):
    _get_projet_or_404(projet_id, db)
    return db.query(PieceDossier).filter(PieceDossier.projet_id == projet_id).all()


@router.patch("/{piece_id}", response_model=PieceDossierRead)
def update_statut(projet_id: int, piece_id: int, data: PieceDossierUpdate, db: Session = Depends(get_db)):
    piece = _get_piece_or_404(projet_id, piece_id, db)
    piece.statut = data.statut
    db.commit()
    db.refresh(piece)
    return piece


@router.post("/{piece_id}/document", response_model=PieceDossierRead)
def upload_document(
    projet_id: int,
    piece_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    piece = _get_piece_or_404(projet_id, piece_id, db)

    dossier_cible = os.path.join(settings.piece_dossier_storage_path, str(projet_id))
    os.makedirs(dossier_cible, exist_ok=True)

    # Préfixe par piece_id pour éviter toute collision de nom entre deux pièces
    nom_fichier_disque = f"{piece_id}_{file.filename}"
    chemin_absolu = os.path.join(dossier_cible, nom_fichier_disque)

    with open(chemin_absolu, "wb") as f:
        shutil.copyfileobj(file.file, f)

    piece.document_path = chemin_absolu
    piece.document_nom_original = file.filename
    db.commit()
    db.refresh(piece)
    return piece


@router.get("/{piece_id}/document")
def telecharger_document(projet_id: int, piece_id: int, db: Session = Depends(get_db)):
    piece = _get_piece_or_404(projet_id, piece_id, db)

    if not piece.document_path or not os.path.exists(piece.document_path):
        raise HTTPException(status_code=404, detail="Aucun document joint pour cette pièce")

    return FileResponse(piece.document_path, filename=piece.document_nom_original or os.path.basename(piece.document_path))