from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, func
from app.core.database import Base


class AnalyseDce(Base):
    """Analyse IA structurée du contenu réel des documents d'un DCE (post-téléchargement).

    Distincte d'AnalyseIA (qui analyse l'avis, avant téléchargement) : voir justification
    dans le prompt de session — séparation acquisition/analyse préservée.
    """

    __tablename__ = "analyse_dce"

    id = Column(Integer, primary_key=True, index=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), unique=True, nullable=False, index=True)

    resume = Column(Text, nullable=True)                     # résumé exécutif
    objet_marche = Column(Text, nullable=True)                # objet du marché reformulé clairement
    prestations_attendues = Column(Text, nullable=True)       # JSON string (liste de str)
    competences_recherchees = Column(Text, nullable=True)    # JSON string (liste de str)
    technologies_mentionnees = Column(Text, nullable=True)   # JSON string (liste de str)
    pieces_administratives = Column(Text, nullable=True)     # JSON string (liste de str) — AE, RC, CPS, attestations...
    livrables_attendus = Column(Text, nullable=True)          # JSON string (liste de str)
    contraintes_importantes = Column(Text, nullable=True)     # JSON string (liste de str)
    criteres_evaluation = Column(Text, nullable=True)        # JSON string (liste de str)
    delais_importants = Column(Text, nullable=True)          # JSON string (liste de {libelle, date})
    points_vigilance = Column(Text, nullable=True)            # JSON string (liste de str) — risques identifiés
    recommandations = Column(Text, nullable=True)              # JSON string (liste de str) — pour SIS
    budget = Column(String, nullable=True)                   # texte libre : souvent descriptif ou fourchette

    # en_attente | en_cours | complete | partielle | echec
    statut = Column(String, nullable=False, default="en_attente")
    erreur = Column(Text, nullable=True)

    nb_documents_analyses = Column(Integer, nullable=True)   # nb de DceDocument effectivement inclus dans le contexte
    contexte_tronque = Column(Boolean, nullable=True)         # au moins un document a été raccourci avant
                                                                # d'atteindre le LLM (voir context_builder.py)
    nb_caracteres_contexte = Column(Integer, nullable=True)   # taille réelle du texte envoyé au LLM
    modele_utilise = Column(String, nullable=True)
    date_analyse = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())