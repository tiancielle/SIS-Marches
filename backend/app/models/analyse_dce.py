from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from app.core.database import Base


class AnalyseDce(Base):
    """Analyse IA structurée du contenu réel des documents d'un DCE (post-téléchargement).

    Distincte d'AnalyseIA (qui analyse l'avis, avant téléchargement) : voir justification
    dans le prompt de session — séparation acquisition/analyse préservée.
    """

    __tablename__ = "analyse_dce"

    id = Column(Integer, primary_key=True, index=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), unique=True, nullable=False, index=True)

    resume = Column(Text, nullable=True)
    competences_recherchees = Column(Text, nullable=True)    # JSON string (liste de str)
    technologies_mentionnees = Column(Text, nullable=True)   # JSON string (liste de str)
    pieces_administratives = Column(Text, nullable=True)     # JSON string (liste de str)
    criteres_evaluation = Column(Text, nullable=True)        # JSON string (liste de str)
    delais_importants = Column(Text, nullable=True)          # JSON string (liste de {libelle, date})
    budget = Column(String, nullable=True)                   # texte libre : souvent descriptif ou fourchette

    # en_attente | en_cours | complete | partielle | echec
    statut = Column(String, nullable=False, default="en_attente")
    erreur = Column(Text, nullable=True)

    nb_documents_analyses = Column(Integer, nullable=True)   # nb de DceDocument effectivement inclus dans le contexte
    modele_utilise = Column(String, nullable=True)
    date_analyse = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
