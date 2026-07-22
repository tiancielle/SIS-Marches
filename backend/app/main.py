import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.scheduler import start_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="SIS Suivi Marchés API")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from app.core.database import Base, engine
from app.models import projet, sous_traitant
from app.models import contrat
from app.models import dce
from app.models import equipe, projet_equipe
from app.models import appel_offres, analyse_ia  # noqa: F401 — nouveau module
from app.models import dce_document, analyse_dce  # noqa: F401 — pipeline de traitement des DCE

Base.metadata.create_all(bind=engine)

from app.routers import projets, sous_traitants
from app.routers import contrats
from app.routers import dce
from app.routers import equipe
from app.routers import appel_offres as appel_offres_router  # nouveau

app.include_router(dce.router)
app.include_router(contrats.router)
app.include_router(projets.router)
app.include_router(sous_traitants.router)
app.include_router(equipe.router)
app.include_router(equipe.projet_equipe_router)
app.include_router(appel_offres_router.router)

@app.on_event("startup")
def on_startup():
    start_scheduler()
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}