from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.appel_offres import AppelOffres
from app.models.analyse_dce import AnalyseDce
from app.models.dce_document import DceDocument
from app.schemas.appel_offres import AppelOffresRead, SyncResult, DceDownloadResult
from app.schemas.analyse_dce import AnalyseDceRead, DceDocumentRead, TraiterDceResult
from app.services.acquisition import sync_orchestrator
from app.services.dce_processing.dce_pipeline import run_pipeline, DcePipelineError

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
    result = sync_orchestrator.download_dce_for(db, appel_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("reason", "Échec du téléchargement"))
    return result


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
    """Réversibilité ignore -> nouveau (règle métier 4.1)."""
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    if appel.statut != "ignore":
        raise HTTPException(status_code=409, detail="Seul un appel d'offres ignoré peut être réactivé")
    appel.statut = "nouveau"
    db.commit()
    db.refresh(appel)
    return appel


@router.post("/{appel_id}/traiter-dce", response_model=TraiterDceResult)
def traiter_dce(appel_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Déclenche le pipeline de traitement du DCE (extraction + analyse IA) en arrière-plan.
    Précondition : le DCE doit déjà avoir été téléchargé (url_cps non nul), sinon 409.
    Le résultat se consulte ensuite via GET /{appel_id}/analyse-dce (polling sur `statut`)."""
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        raise HTTPException(status_code=404, detail="Appel d'offres introuvable")
    if not appel.url_cps:
        raise HTTPException(status_code=409, detail="Aucun DCE téléchargé pour cet appel d'offres — utilisez d'abord /telecharger-dce")

    def _run_pipeline_background():
        bg_db = SessionLocal()
        try:
            run_pipeline(bg_db, appel_id)
        finally:
            bg_db.close()

    background_tasks.add_task(_run_pipeline_background)
    return TraiterDceResult(status="demarree", message="Traitement du DCE lancé en arrière-plan")


@router.get("/{appel_id}/analyse-dce", response_model=AnalyseDceRead)
def get_analyse_dce(appel_id: int, db: Session = Depends(get_db)):
    analyse = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_id).first()
    if not analyse:
        raise HTTPException(status_code=404, detail="Aucune analyse DCE pour cet appel d'offres — lancez /traiter-dce")
    return AnalyseDceRead.from_orm_model(analyse)


@router.get("/{appel_id}/documents-dce", response_model=list[DceDocumentRead])
def list_documents_dce(appel_id: int, db: Session = Depends(get_db)):
    """Liste des fichiers indexés du DCE avec leur statut d'extraction individuel —
    utile pour afficher côté frontend pourquoi une analyse est 'partielle' (ex. un
    PDF scanné ou un .doc non converti)."""
    return db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_id).all()