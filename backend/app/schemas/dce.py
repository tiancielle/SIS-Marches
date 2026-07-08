from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DCEBase(BaseModel):
    projet_id: int
    objet: Optional[str] = None
    organisme: Optional[str] = None
    montant_estimatif: Optional[float] = None
    date_limite_remise: Optional[date] = None
    type_procedure: Optional[str] = None
    pieces_exigees: Optional[str] = None
    document_nom: Optional[str] = None

class DCECreate(DCEBase):
    pass

class DCEUpdate(DCEBase):
    pass

class DCERead(DCEBase):
    id: int
    date_creation: datetime
    model_config = ConfigDict(from_attributes=True)