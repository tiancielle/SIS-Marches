from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from app.core.database import Base

class HistoriqueEvenement(Base):
    __tablename__ = "historique_evenements"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, index=True)
    
    # Type d'événement : creation, statut_change, equipe_affectee, contrat_cree, 
    # livrable_ajoute, facture_cree, paiement_enregistre, etc.
    type_evenement = Column(String, nullable=False, index=True)
    
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Ancien/Nouveau statut pour les changements de statut
    ancien_statut = Column(String, nullable=True)
    nouveau_statut = Column(String, nullable=True)
    
    # Métadonnées pour les événements complexes (JSON)
    donnees = Column(Text, nullable=True)
    
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
