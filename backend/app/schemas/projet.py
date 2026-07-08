from datetime import date
from pydantic import BaseModel, ConfigDict
from typing import Optional


from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProjetBase(BaseModel):
    nom: str
    client: str
    lieu: str
    budget: float
    budget_engage: Optional[float] = 0
    debut: date
    fin: date
    statut: str
    chef: str
    budget_engage: Optional[float] = 0

class ProjetCreate(ProjetBase):
    pass

class ProjetUpdate(ProjetBase):
    pass

class ProjetRead(ProjetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
