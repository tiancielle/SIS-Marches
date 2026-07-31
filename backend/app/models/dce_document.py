"""
Modèle de données représentant un fichier individuel extrait d'une archive DCE.

Justification architecturale : Ce modèle applique le principe de séparation des 
préoccupations (Separation of Concerns). La base de données ne stocke que les 
métadonnées et un pointeur vers le fichier texte extrait sur disque. Stocker le 
contenu texte brut en base (BLOB/Text) aurait alourdi inutilement la base de données, 
ralenti les requêtes et compliqué les sauvegardes, sans apporter de valeur ajoutée 
pour les opérations de filtrage ou de jointure.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from app.core.database import Base


class DceDocument(Base):
    """Un fichier extrait du zip DCE d'un AppelOffres (métadonnées + pointeur vers le texte extrait sur disque)."""

    __tablename__ = "dce_document"

    id = Column(Integer, primary_key=True, index=True)
    
    # Clé étrangère indexée pour optimiser les jointures et les requêtes de filtrage 
    # par appel d'offres (ex: récupérer tous les documents d'un DCE spécifique en O(log N)).
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=False, index=True)

    # Conservation du nom original et du chemin relatif pour garantir la traçabilité 
    # (audit) et permettre un affichage fidèle à l'utilisateur, même si le système 
    # de fichiers sous-jacent a dû assainir (sanitize) ces valeurs pour éviter les 
    # erreurs d'écriture (ex: caractères interdits sous Windows).
    nom_fichier = Column(String, nullable=False)          # nom original (peut contenir accents/espaces)
    chemin_relatif = Column(String, nullable=False)        # chemin relatif dans le zip (sous-dossiers conservés)
    
    type_fichier = Column(String)                          # pdf, docx, doc, xlsx, autre
    taille_octets = Column(Integer)

    # Pointeur vers le système de fichiers. Le texte brut n'est jamais stocké en BDD 
    # pour des raisons de performance, de limite de taille et de séparation des couches.
    texte_extrait_path = Column(String, nullable=True)     # chemin vers un .txt sur disque, jamais le texte en BDD
    nb_caracteres_extraits = Column(Integer, nullable=True)

    # MACHINE À ÉTATS (State Machine) : Ce champ permet au pipeline de signaler 
    # précisément pourquoi un document n'a pas pu être traité (ex: format non supporté, 
    # fichier corrompu, ou échec OCR), offrant une observabilité granulaire sans faire 
    # échouer l'ingestion globale du DCE (dégradation gracieuse).
    # Valeurs possibles : succes | echec | non_supporte
    statut_extraction = Column(String, nullable=False, default="en_attente")
    erreur = Column(Text, nullable=True)

    # Horodatage automatique pour le suivi de l'âge des données, le débogage et l'audit.
    date_extraction = Column(DateTime(timezone=True), server_default=func.now())