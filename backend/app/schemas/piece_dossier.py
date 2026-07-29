from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class PieceDossierBase(BaseModel):
    libelle: str
    statut: Literal["a_preparer", "preparee"] = "a_preparer"


class PieceDossierUpdate(BaseModel):
    statut: Literal["a_preparer", "preparee"]


class PieceDossierRead(PieceDossierBase):
    id: int
    projet_id: int
    document_path: Optional[str] = None
    document_nom_original: Optional[str] = None
    date_maj: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
