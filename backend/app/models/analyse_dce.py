"""
Modèle de données représentant l'analyse IA structurée du contenu réel des documents d'un DCE.

Justification architecturale : Ce modèle est strictement distinct de l'analyse de l'avis 
(portail). Il matérialise le résultat de l'étape d'inférence (LLM) sur les documents 
téléchargés. La présence de champs de métadonnées d'exécution (troncature, nombre de 
caractères, modèle utilisé) est cruciale pour l'auditabilité, la reproductibilité des 
résultats et l'évaluation de la qualité des données (Data Quality) en science des données.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, func
from app.core.database import Base


class AnalyseDce(Base):
    """Analyse IA structurée du contenu réel des documents d'un DCE (post-téléchargement).

    Distincte d'AnalyseIA (qui analyse l'avis, avant téléchargement) : voir justification
    dans le prompt de session — séparation acquisition/analyse préservée.
    """

    __tablename__ = "analyse_dce"

    id = Column(Integer, primary_key=True, index=True)
    
    # Contrainte d'unicité (unique=True) : garantit qu'il n'existe qu'une seule analyse 
    # par appel d'offres, renforçant l'idempotence du pipeline et évitant les doublons 
    # en cas de relance ou de bug d'orchestration.
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), unique=True, nullable=False, index=True)

    # --- Champs d'extraction sémantique (contenu métier) ---
    resume = Column(Text, nullable=True)                     # résumé exécutif
    objet_marche = Column(Text, nullable=True)                # objet du marché reformulé clairement
    
    # CHOIX DE MODÉLISATION (JSON dans Text) : Les listes de chaînes sont sérialisées 
    # en JSON et stockées dans des colonnes Text. Cela évite la complexité d'un schéma 
    # relationnel 1-to-N (table séparée) pour des données qui sont principalement lues 
    # en bloc par l'application, tout en restant compatible avec SQLite et les requêtes 
    # JSON natives des SGBD plus avancés si une migration future est envisagée.
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

    # MACHINE À ÉTATS GLOBALE : Permet au frontend de savoir si l'analyse est 
    # en_attente, en_cours, complete, partielle (certains champs manquants) ou echec.
    statut = Column(String, nullable=False, default="en_attente")
    erreur = Column(Text, nullable=True)

    # --- MÉTADONNÉES D'EXÉCUTION (Data Provenance) ---
    # Ces champs sont essentiels pour un encadrant en data mining. Ils permettent de 
    # comprendre le contexte de la génération : combien de documents ont été réellement 
    # lus, si le contexte a été tronqué (ce qui peut expliquer des hallucinations ou 
    # des informations manquantes), la taille exacte du prompt, et le modèle utilisé 
    # (crucial pour la reproductibilité scientifique, le débogage et le suivi des coûts).
    nb_documents_analyses = Column(Integer, nullable=True)   # nb de DceDocument effectivement inclus dans le contexte
    contexte_tronque = Column(Boolean, nullable=True)         # au moins un document a été raccourci avant d'atteindre le LLM
    nb_caracteres_contexte = Column(Integer, nullable=True)   # taille réelle du texte envoyé au LLM
    modele_utilise = Column(String, nullable=True)
    
    # Horodatage avec mise à jour automatique pour suivre la fraîcheur de l'analyse.
    date_analyse = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())