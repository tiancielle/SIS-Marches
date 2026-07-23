import json
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DceDocumentRead(BaseModel):
    id: int
    appel_offres_id: int
    nom_fichier: str
    chemin_relatif: str
    type_fichier: Optional[str] = None
    taille_octets: Optional[int] = None
    nb_caracteres_extraits: Optional[int] = None
    statut_extraction: str
    erreur: Optional[str] = None
    date_extraction: datetime

    model_config = ConfigDict(from_attributes=True)


class DelaiImportant(BaseModel):
    libelle: str
    date: Optional[str] = None


class AnalyseDceRead(BaseModel):
    id: int
    appel_offres_id: int
    resume: Optional[str] = None
    objet_marche: Optional[str] = None
    prestations_attendues: list[str] = []
    competences_recherchees: list[str] = []
    technologies_mentionnees: list[str] = []
    pieces_administratives: list[str] = []
    livrables_attendus: list[str] = []
    contraintes_importantes: list[str] = []
    criteres_evaluation: list[str] = []
    delais_importants: list[DelaiImportant] = []
    points_vigilance: list[str] = []
    recommandations: list[str] = []
    budget: Optional[str] = None
    statut: str
    erreur: Optional[str] = None
    nb_documents_analyses: Optional[int] = None
    modele_utilise: Optional[str] = None
    date_analyse: datetime

    model_config = ConfigDict(from_attributes=True)

    @staticmethod
    def _safe_json_list(raw: Optional[str]) -> list:
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    @classmethod
    def from_orm_model(cls, analyse) -> "AnalyseDceRead":
        """Construit le schéma de lecture à partir du modèle SQLAlchemy, en désérialisant
        les champs JSON stockés en Text. À utiliser dans les routers plutôt que
        model_validate directement, car les types stockés (str) diffèrent des types
        exposés (list)."""
        return cls(
            id=analyse.id,
            appel_offres_id=analyse.appel_offres_id,
            resume=analyse.resume,
            objet_marche=analyse.objet_marche,
            prestations_attendues=cls._safe_json_list(analyse.prestations_attendues),
            competences_recherchees=cls._safe_json_list(analyse.competences_recherchees),
            technologies_mentionnees=cls._safe_json_list(analyse.technologies_mentionnees),
            pieces_administratives=cls._safe_json_list(analyse.pieces_administratives),
            livrables_attendus=cls._safe_json_list(analyse.livrables_attendus),
            contraintes_importantes=cls._safe_json_list(analyse.contraintes_importantes),
            criteres_evaluation=cls._safe_json_list(analyse.criteres_evaluation),
            delais_importants=cls._safe_json_list(analyse.delais_importants),
            points_vigilance=cls._safe_json_list(analyse.points_vigilance),
            recommandations=cls._safe_json_list(analyse.recommandations),
            budget=analyse.budget,
            statut=analyse.statut,
            erreur=analyse.erreur,
            nb_documents_analyses=analyse.nb_documents_analyses,
            modele_utilise=analyse.modele_utilise,
            date_analyse=analyse.date_analyse,
        )


class TraiterDceResult(BaseModel):
    status: str
    message: str