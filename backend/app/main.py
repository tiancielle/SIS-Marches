from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="SIS Suivi Marchés API")

from app.core.database import Base, engine
from app.models import projet, sous_traitant  # noqa: F401 — nécessaire pour enregistrer les tables

from app.models import contrat  # noqa: F401
from app.models import dce  # noqa: F401
from app.models import equipe, projet_equipe  

Base.metadata.create_all(bind=engine)

from app.routers import projets, sous_traitants
from app.routers import contrats
from app.routers import dce

app.include_router(dce.router)
app.include_router(contrats.router)
app.include_router(projets.router)
app.include_router(sous_traitants.router)

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

# Les routers (projets, sous_traitants, ...) seront inclus ici aux prochaines étapes.