from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func
from app.core.database import Base

class AnalyseIA(Base):
    __tablename__ = "analyse_ia"

    id = Column(Integer, primary_key=True, index=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=False, unique=True)

    resume = Column(Text, nullable=True)
    mots_cles = Column(Text, nullable=True)
    technologies_detectees = Column(Text, nullable=True)
    score_pertinence = Column(Float, nullable=True)
    justification = Column(Text, nullable=True)
    recommandations = Column(Text, nullable=True)
    modele_utilise = Column(String, nullable=True)

    date_analyse = Column(DateTime(timezone=True), server_default=func.now())