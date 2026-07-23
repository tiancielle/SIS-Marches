from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProjetBase(BaseModel):
    nom: str
    client: Optional[str] = None
    lieu: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    budget_engage: Optional[float] = 0
    debut: Optional[date] = None
    fin: Optional[date] = None
    statut: str = "interesse"
    chef: Optional[str] = None
    chef_id: Optional[int] = None
    appel_offres_id: Optional[int] = None
    origine: str = "manuel"
    date_soumission: Optional[date] = None


class ProjetCreate(ProjetBase):
    pass


class ProjetUpdate(ProjetBase):
    pass


class ProjetRead(ProjetBase):
    id: int
    date_creation: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class InteresserRequest(BaseModel):
    nom_projet: Optional[str] = None
    chef_projet_id: int
    date_debut_prevue: Optional[date] = None