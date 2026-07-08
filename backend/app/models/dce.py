from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey, DateTime, func
from app.core.database import Base

class DCE(Base):
    __tablename__ = "dce"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, unique=True)  # 1:1 avec Projet

    objet = Column(Text, nullable=True)
    organisme = Column(String, nullable=True)
    montant_estimatif = Column(Float, nullable=True)
    date_limite_remise = Column(Date, nullable=True)
    type_procedure = Column(String, nullable=True)
    pieces_exigees = Column(Text, nullable=True)  # une pièce par ligne, texte libre

    document_nom = Column(String, nullable=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())