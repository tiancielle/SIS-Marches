from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.appel_offres import AppelOffres
from app.schemas.appel_offres import AppelOffresRead, SyncResult, DceDownloadResult
from app.services.acquisition import sync_orchestrator

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