from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AppelOffresBase(BaseModel):
    reference: str
    objet: Optional[str] = None
    organisme: Optional[str] = None
    date_limite_remise: Optional[date] = None
    montant_estimatif: Optional[float] = None
    type_procedure: Optional[str] = None
    url_avis: Optional[str] = None
    url_cps: Optional[str] = None
    statut: str = "nouveau"
    dce_statut: str = "NON_TELECHARGE"
    dce_erreur: Optional[str] = None
    ref_consultation: Optional[str] = None
    org_acronyme: Optional[str] = None

class AppelOffresCreate(AppelOffresBase):
    pass

class AppelOffresRead(AppelOffresBase):
    id: int
    date_import: datetime
    model_config = ConfigDict(from_attributes=True)

class SyncResult(BaseModel):
    nb_trouves: int
    nb_nouveaux: int
    nb_doublons: int
    nb_erreurs: int
    references_nouvelles: list[str]

class DceDownloadResult(BaseModel):
    success: bool
    url_cps: Optional[str] = None
    reason: Optional[str] = None
    cached: bool = False