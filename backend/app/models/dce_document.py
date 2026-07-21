from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from app.core.database import Base


class DceDocument(Base):
    """Un fichier extrait du zip DCE d'un AppelOffres (métadonnées + pointeur vers le texte extrait sur disque)."""

    __tablename__ = "dce_document"

    id = Column(Integer, primary_key=True, index=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=False, index=True)

    nom_fichier = Column(String, nullable=False)          # nom original (peut contenir accents/espaces)
    chemin_relatif = Column(String, nullable=False)        # chemin relatif dans le zip (sous-dossiers conservés)
    type_fichier = Column(String)                          # pdf, docx, doc, xlsx, autre
    taille_octets = Column(Integer)

    texte_extrait_path = Column(String, nullable=True)     # chemin vers un .txt sur disque, jamais le texte en BDD
    nb_caracteres_extraits = Column(Integer, nullable=True)

    # succes | echec | non_supporte
    statut_extraction = Column(String, nullable=False, default="en_attente")
    erreur = Column(Text, nullable=True)

    date_extraction = Column(DateTime(timezone=True), server_default=func.now())
