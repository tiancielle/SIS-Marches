from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.core.database import Base

class Contrat(Base):
    __tablename__ = "contrats"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False)
    sous_traitant_id = Column(Integer, ForeignKey("sous_traitants.id"), nullable=False)
    reference = Column(String, nullable=True)       # ex: "CT-2025-014" (correspond à contratRef)
    montant = Column(Float, nullable=True)
    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)
    statut = Column(String, nullable=False, default="actif")
    document_nom = Column(String, nullable=True)     # nom de fichier — stockage réel géré plus tard