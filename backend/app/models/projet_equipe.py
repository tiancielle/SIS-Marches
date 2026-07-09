from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class ProjetEquipe(Base):
    __tablename__ = "projet_equipe"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"), nullable=False)
    equipe_id = Column(Integer, ForeignKey("equipe.id"), nullable=False)
    role = Column(String, nullable=True)  # role sur ce projet précis (peut différer de l'intitulé de l'équipe)