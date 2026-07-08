from typing import Optional
from pydantic import BaseModel, ConfigDict

class SousTraitantBase(BaseModel):
    name: str
    specialite: str
    contact: str
    email: Optional[str] = None
    phone: Optional[str] = None
    ice: Optional[str] = None

class SousTraitantCreate(SousTraitantBase):
    pass

class SousTraitantUpdate(SousTraitantBase):
    pass

class SousTraitantRead(SousTraitantBase):
    id: int
    model_config = ConfigDict(from_attributes=True)