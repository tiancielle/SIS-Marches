from sqlalchemy import Column, Integer, String, Float, Date
from app.core.database import Base

class Projet(Base):
    __tablename__ = "projets"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    client = Column(String, nullable=False)
    lieu = Column(String, nullable=False)
    budget = Column(Float, nullable=False)
    debut = Column(Date, nullable=False)
    fin = Column(Date, nullable=False)
    statut = Column(String, nullable=False, default="actif")  # "actif" | "termine"
    chef = Column(String, nullable=False)