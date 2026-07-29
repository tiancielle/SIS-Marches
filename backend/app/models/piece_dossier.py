# app/models/piece_dossier.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.core.database import Base

class PieceDossier(Base):
    __tablename__ = "piece_dossier"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, index=True)
    libelle = Column(Text, nullable=False)
    statut = Column(String, nullable=False, default="a_preparer")  # a_preparer | preparee
    document_path = Column(String, nullable=True)
    document_nom_original = Column(String, nullable=True)  # pour l'affichage, le chemin seul n'est pas parlant côté frontend
    date_maj = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())