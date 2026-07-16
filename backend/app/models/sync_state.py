"""
Mémorise la date de la dernière synchronisation réussie, pour ne récupérer
que les nouveaux avis à chaque run (plutôt que de tout re-parcourir).
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base


class SyncState(Base):
    __tablename__ = "sync_state"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, unique=True, default="appel_offres")
    derniere_synchro = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())