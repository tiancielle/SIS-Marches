# app/models/analyse_dce.py
from unittest.mock import Base

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func


class AnalyseDce(Base):
    __tablename__ = "analyse_dce"
    id = Column(Integer, primary_key=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), unique=True, nullable=False)
    resume = Column(Text)
    competences_recherchees = Column(Text)   # JSON string (liste)
    technologies_mentionnees = Column(Text)  # JSON string (liste)
    pieces_administratives = Column(Text)    # JSON string (liste)
    criteres_evaluation = Column(Text)
    delais_importants = Column(Text)         # JSON string (liste de {libelle, date})
    budget = Column(String, nullable=True)   # texte, pas float : souvent descriptif ou fourchette
    statut = Column(String, default="en_attente")  # en_attente | complete | partielle | echec
    modele_utilise = Column(String, nullable=True)
    date_analyse = Column(DateTime(timezone=True), server_default=func.now())