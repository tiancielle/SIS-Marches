from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ContratBase(BaseModel):
    projet_id: int
    sous_traitant_id: int
    reference: Optional[str] = None
    montant: Optional[float] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: str = "actif"
    document_nom: Optional[str] = None

class ContratCreate(ContratBase):
    pass

class ContratUpdate(ContratBase):
    pass

class ContratRead(ContratBase):
    id: int
    model_config = ConfigDict(from_attributes=True)