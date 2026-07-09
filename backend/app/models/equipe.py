from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Equipe(Base):
    __tablename__ = "equipe"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    intitule = Column(String, nullable=True)   # ex: "Chef de projet", "Ingénieur BTP"
    type = Column(String, nullable=True)        # ex: "interne" / "externe"
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)