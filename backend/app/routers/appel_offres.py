import json
import logging
import os
import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import requests

from app.core.database import get_db, SessionLocal
from app.core.config import settings  # ← AJOUTÉ pour acceder à dce_extracted_storage_path
from app.models.appel_offres import AppelOffres
from app.models.analyse_dce import AnalyseDce
from app.models.dce_document import DceDocument
from app.models.piece_dossier import PieceDossier  # ← AJOUTÉ
from app.models.projet import Projet
from app.models.equipe import Equipe
from app.schemas.appel_offres import AppelOffresRead, SyncResult, DceDownloadResult
from app.schemas.analyse_dce import AnalyseDceRead, DceDocumentRead, TraiterDceResult
from app.schemas.projet import ProjetRead, InteresserRequest
from app.services.acquisition import sync_orchestrator
from app.services.dce_processing.dce_pipeline import run_pipeline, DcePipelineError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appels-offres", tags=["appels-offres"])


@router.get("/", response_model=list[AppelOffresRead])
def list_appels_offres(statut: str | None = None, db: Session = Depends(get_db)):
    query = db.query(AppelOffres)
    if statut is not None:
        query = query.filter(AppelOffres.statut == statut)
    return query.all()


@router.get("/{appel_id}", response_model=AppelOffresRead)
def get_appel_offres(appel_id: int, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    return appel


@router.post("/synchroniser")
def synchroniser(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    def _run_sync_background():
        bg_db = SessionLocal()
        try:
            sync_orchestrator.run(bg_db)
        finally:
            bg_db.close()

    background_tasks.add_task(_run_sync_background)
    return {"status": "demarree", "message": "Synchronisation lancée en arrière-plan"}


@router.post("/{appel_id}/telecharger-dce", response_model=DceDownloadResult)
def telecharger_dce(appel_id: int, db: Session = Depends(get_db)):
    try:
        result = sync_orchestrator.download_dce_for(db, appel_id)
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Le portail des marchés publics n'a pas répondu à temps ou a coupé la connexion : {exc}. Réessaie.",
        )
    
    if not result.get("success"):
        if result.get("in_progress"):
            raise HTTPException(status_code=409, detail=result.get("reason"))
        raise HTTPException(status_code=502, detail=result.get("reason", "Échec du téléchargement"))
    
    return result


@router.get("/{appel_id}/telecharger-dce/fichier")
def telecharger_dce_fichier(appel_id: int, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    if not appel.url_cps:
        raise HTTPException(status_code=404, detail="Aucun DCE téléchargé pour cet appel d'offres.")
    if not os.path.exists(appel.url_cps):
        raise HTTPException(
            status_code=404,
            detail="Le fichier DCE référencé n'existe plus sur le serveur (supprimé manuellement ?). "
                   "Relance le téléchargement.",
        )

    nom_fichier = f"DCE_{appel.reference or appel_id}.zip".replace("/", "_")
    return FileResponse(
        path=appel.url_cps,
        media_type="application/zip",
        filename=nom_fichier,
    )


@router.post("/{appel_id}/ignorer", response_model=AppelOffresRead)
def ignorer(appel_id: int, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    appel.statut = "ignore"
    db.commit()
    db.refresh(appel)
    return appel


@router.post("/{appel_id}/reactiver", response_model=AppelOffresRead)
def reactiver(appel_id: int, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    if appel.statut != "ignore":
        raise HTTPException(status_code=409, detail="Seul un appel d'offres ignoré peut être réactivé")
    appel.statut = "nouveau"
    db.commit()
    db.refresh(appel)
    return appel


def _parse_budget_texte(budget_texte: str) -> float | None:
    digits = re.sub(r"[^\d.]", "", budget_texte.replace(",", ""))
    try:
        return float(digits) if digits else None
    except ValueError:
        return None


@router.post("/{appel_id}/interesser", response_model=ProjetRead, status_code=201)
def interesser(appel_id: int, data: InteresserRequest, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")

    if appel.statut in ("interesse", "ignore"):
        raise HTTPException(status_code=409, detail=f"Cet appel d'offres est déjà '{appel.statut}'.")

    if db.query(Projet).filter(Projet.appel_offres_id == appel_id).first():
        raise HTTPException(status_code=409, detail="Un Projet existe déjà pour cet appel d'offres.")

    chef = None
    if data.chef_projet_id is not None:
        chef = db.query(Equipe).filter(Equipe.id == data.chef_projet_id).first()
        if not chef:
            raise HTTPException(status_code=404, detail="chef_projet_id ne correspond à aucun membre de l'équipe")

    analyse = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_id).first()

    nom = data.nom_projet or (appel.objet[:200] if appel.objet else f"Projet — {appel.reference}")

    budget = appel.montant_estimatif
    if budget is None and analyse and analyse.budget:
        budget = _parse_budget_texte(analyse.budget)

    description_parts = [appel.objet or ""]
    if analyse and analyse.resume:
        description_parts.append(f"\n\nRésumé IA (DCE) :\n{analyse.resume}")
    if appel.type_procedure:
        description_parts.append(f"\n\nType de procédure : {appel.type_procedure}")

    projet = Projet(
        appel_offres_id=appel.id,
        origine="appel_offres",
        nom=nom,
        client=appel.organisme,
        description="".join(description_parts).strip() or None,
        budget=budget,
        budget_engage=0,
        debut=data.date_debut_prevue,
        fin=None,
        chef=chef.nom if chef else None,
        chef_id=chef.id if chef else None,
        statut="interesse",
        url_avis=appel.url_avis,
    )
    db.add(projet)

    appel.statut = "interesse"

    db.commit()
    db.refresh(projet)

    # ← NOUVEAU : Pré-remplissage de la checklist à partir de l'analyse déjà réalisée
    if analyse and analyse.pieces_administratives:
        try:
            libelles = json.loads(analyse.pieces_administratives)
        except (json.JSONDecodeError, TypeError):
            libelles = []
        for libelle in libelles:
            db.add(PieceDossier(projet_id=projet.id, libelle=libelle, statut="a_preparer"))
        db.commit()

    projet_read = ProjetRead.model_validate(projet)
    projet_read.a_analyse_dce = analyse is not None
    return projet_read


@router.post("/{appel_id}/traiter-dce", response_model=TraiterDceResult)
def traiter_dce(appel_id: int, background_tasks: BackgroundTasks, force: bool = False, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    if not appel.url_cps:
        raise HTTPException(status_code=409, detail="Aucun DCE téléchargé pour cet appel d'offres — utilisez d'abord /telecharger-dce")

    def _run_pipeline_background():
        bg_db = SessionLocal()
        try:
            run_pipeline(bg_db, appel_id, force=force)
        except Exception as exc:
            logger.exception(f"Pipeline DCE : échec non anticipé pour AppelOffres {appel_id}")
            analyse = bg_db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_id).first()
            if analyse is None:
                analyse = AnalyseDce(appel_offres_id=appel_id)
                bg_db.add(analyse)
            analyse.statut = "echec"
            analyse.erreur = f"Erreur interne inattendue : {exc}"
            bg_db.commit()
        finally:
            bg_db.close()

    background_tasks.add_task(_run_pipeline_background)
    return TraiterDceResult(status="demarree", message="Traitement du DCE lancé en arrière-plan")


@router.get("/{appel_id}/analyse-dce", response_model=AnalyseDceRead)
def get_analyse_dce(appel_id: int, db: Session = Depends(get_db)):
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    
    analyse = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_id).first()
    
    if not analyse:
        return AnalyseDceRead(
            id=0,
            appel_offres_id=appel_id,
            statut="non_analyse",
            date_analyse=datetime.now()
        )
    
    return AnalyseDceRead.from_orm_model(analyse)


@router.get("/{appel_id}/documents-dce", response_model=list[DceDocumentRead])
def list_documents_dce(appel_id: int, db: Session = Depends(get_db)):
    return db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_id).all()


# ← NOUVEAU ENDPOINT : Téléchargement d'un document individuel extrait du DCE
@router.get("/{appel_id}/documents-dce/{document_id}/fichier")
def telecharger_document_dce(appel_id: int, document_id: int, db: Session = Depends(get_db)):
    doc = db.query(DceDocument).filter(
        DceDocument.id == document_id, DceDocument.appel_offres_id == appel_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")

    chemin_absolu = os.path.join(settings.dce_extracted_storage_path, str(appel_id), doc.chemin_relatif)
    if not os.path.exists(chemin_absolu):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur disque")

    return FileResponse(chemin_absolu, filename=doc.nom_fichier)