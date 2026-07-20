# app/models/dce_document.py

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from backend.app.core.database import Base


class DceDocument(Base):
    __tablename__ = "dce_document"
    id = Column(Integer, primary_key=True)
    appel_offres_id = Column(Integer, ForeignKey("appel_offres.id"), nullable=False, index=True)
    nom_fichier = Column(String, nullable=False)
    type_fichier = Column(String)          # pdf, docx, doc, xlsx, autre
    taille_octets = Column(Integer)
    texte_extrait_path = Column(String)    # chemin vers un .txt sur disque, pas en BDD (docs volumineux)
    statut_extraction = Column(String)     # succes | echec | non_supporte
    erreur = Column(Text, nullable=True)
    date_extraction = Column(DateTime(timezone=True), server_default=func.now())