from typing import Optional
from pydantic import BaseModel, ConfigDict

class EquipeBase(BaseModel):
    nom: str
    intitule: Optional[str] = None
    type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class EquipeCreate(EquipeBase):
    pass

class EquipeUpdate(EquipeBase):
    pass

class EquipeRead(EquipeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProjetEquipeBase(BaseModel):
    projet_id: int
    equipe_id: int
    role: Optional[str] = None

class ProjetEquipeCreate(ProjetEquipeBase):
    pass

class ProjetEquipeUpdate(ProjetEquipeBase):
    pass

class ProjetEquipeRead(ProjetEquipeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProjetEquipeDetailRead(BaseModel):
    id: int
    projet_id: int
    equipe_id: int
    role: Optional[str] = None
    nom: str
    intitule: Optional[str] = None
    type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None