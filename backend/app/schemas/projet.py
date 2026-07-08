from datetime import date
from pydantic import BaseModel, ConfigDict

class ProjetBase(BaseModel):
    nom: str
    client: str
    lieu: str
    budget: float
    debut: date
    fin: date
    statut: str  # "actif" | "termine"
    chef: str

class ProjetCreate(ProjetBase):
    pass

class ProjetUpdate(ProjetBase):
    pass

class ProjetRead(ProjetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)