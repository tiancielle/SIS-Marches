from sqlalchemy import Column, Integer, String, Float, Date, Text, DateTime, func
from app.core.database import Base

class AppelOffres(Base):
    __tablename__ = "appel_offres"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, nullable=False, unique=True, index=True)
    objet = Column(Text, nullable=True)
    organisme = Column(String, nullable=True)
    date_limite_remise = Column(Date, nullable=True)
    montant_estimatif = Column(Float, nullable=True)
    type_procedure = Column(String, nullable=True)
    url_avis = Column(String, nullable=True)
    url_cps = Column(String, nullable=True)  # chemin local du zip une fois téléchargé
    date_import = Column(DateTime(timezone=True), server_default=func.now())
    statut = Column(String, nullable=False, default="nouveau")  # nouveau | analyse | interesse | ignore

    # Statut explicite du cycle de vie du DCE, distinct de `statut` (métier) —
    # permet au frontend de savoir exactement quoi afficher sans deviner à partir
    # de url_cps seul. NON_TELECHARGE | TELECHARGEMENT | TELECHARGE | ERREUR
    dce_statut = Column(String, nullable=False, default="NON_TELECHARGE")
    dce_erreur = Column(Text, nullable=True)
    
    # Identifiants internes du portail (nécessaires pour reconstruire les URLs fiche/téléchargement)
    ref_consultation = Column(String, nullable=True, index=True)
    org_acronyme = Column(String, nullable=True)