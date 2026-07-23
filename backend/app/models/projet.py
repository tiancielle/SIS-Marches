from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, func
from app.core.database import Base

class Projet(Base):
    __tablename__ = "projets"

    id = Column(Integer, primary_key=True, index=True)

    # Lien vers l'AppelOffres d'origine — nullable et unique : un AO donne naissance
    # à au plus un Projet, mais un Projet n'a pas forcément d'AO d'origine (projet
    # hors-portail, créé manuellement).
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=True, unique=True, index=True)
    origine = Column(String, nullable=False, default="manuel")  # "appel_offres" | "manuel"

    nom = Column(String, nullable=False)
    client = Column(String, nullable=True)
    lieu = Column(String, nullable=True)
    description = Column(Text, nullable=True)  # ex: résumé IA repris depuis AnalyseDce à la conversion

    budget = Column(Float, nullable=True)
    budget_engage = Column(Float, nullable=True, default=0)
    debut = Column(Date, nullable=True)
    fin = Column(Date, nullable=True)

    chef = Column(String, nullable=True)   # nom affiché (dénormalisé, compat V1)
    chef_id = Column(Integer, ForeignKey("equipe.id"), nullable=True)  # vraie FK vers Equipe

    # Cycle de vie V2 complet (remplace l'ancien "actif"/"termine")
    # interesse | en_preparation | soumis | gagne | perdu | abandonne | en_execution | termine
    statut = Column(String, nullable=False, default="interesse")

    date_soumission = Column(Date, nullable=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now())