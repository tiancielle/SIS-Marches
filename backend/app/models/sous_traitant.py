from sqlalchemy import Column, Integer, String
from app.core.database import Base

class SousTraitant(Base):
    __tablename__ = "sous_traitants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialite = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    ice = Column(String, nullable=True)