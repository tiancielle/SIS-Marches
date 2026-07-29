from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.core.database import Base


class PieceDossier(Base):
    """Une pièce administrative à préparer pour candidater à un Projet.

    Pré-remplie automatiquement à la conversion AO -> Projet (une ligne par élément
    de analyse_dce.pieces_administratives), avec `libelle` comme source de vérité
    stockée -- pas de dépendance à l'analyse IA après coup (robuste si le prompt
    LLM évolue plus tard).
    """

    __tablename__ = "piece_dossier"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False, index=True)

    libelle = Column(Text, nullable=False)

    # a_preparer | preparee
    statut = Column(String, nullable=False, default="a_preparer")

    document_path = Column(String, nullable=True)  # chemin absolu sur disque
    document_nom_original = Column(String, nullable=True)  # nom tel qu'uploadé, pour l'affichage

    date_maj = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
