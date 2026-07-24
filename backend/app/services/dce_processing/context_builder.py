"""Assemble le contexte texte envoyé au LLM à partir des DceDocument déjà indexés.

Stratégie de priorisation (décidée avec l'utilisateur) : priorité par mots-clés
métier reconnus dans le nom du fichier (CPS, RC, Acte d'engagement, CCAP, CCTP,
BPU, DQE...), plus proche du réflexe d'un bureau d'études que d'un simple tri par
extension. Si aucun mot-clé n'est détecté, repli sur le type de fichier
(PDF > DOCX > DOC > XLSX > autre).

Troncature : on extrait toujours les documents intégralement (voir text_extractor),
la troncature n'intervient qu'ici, au niveau du texte assemblé pour le LLM.
"""
import unicodedata
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.dce_document import DceDocument

# Mots-clés ordonnés du plus au moins prioritaire. Chaque entrée est une liste de
# variantes (déjà normalisées : minuscules, sans accents) reconnues pour ce rang.
_KEYWORD_PRIORITY: list[list[str]] = [
    ["cps", "cahier des prescriptions speciales", "cahier des prescriptions"],
    ["rc", "reglement de consultation", "reglement"],
    ["ccap"],
    ["cctp"],
    ["acte d'engagement", "acte engagement", "acte d engagement"],
    ["declaration sur l'honneur", "declaration sur l honneur", "declaration honneur"],
    ["bpu", "bordereau des prix", "bordereau de prix", "bordereau prix"],
    ["dqe", "devis quantitatif", "devis quantitatif estimatif"],
    ["avis"],
    ["plan", "dwg"],
]

_TYPE_FALLBACK_RANK = {"pdf": 0, "docx": 1, "doc": 2, "xlsx": 3}
_DEFAULT_TYPE_RANK = 4
_NO_KEYWORD_RANK = len(_KEYWORD_PRIORITY)  # rang réservé aux fichiers sans mot-clé reconnu

_TRUNCATION_NOTICE = "\n\n[... contenu tronqué, limite de contexte atteinte ...]\n"


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_accents.lower()


def _keyword_rank(nom_fichier: str) -> int:
    normalized = _normalize(nom_fichier)
    for rank, variants in enumerate(_KEYWORD_PRIORITY):
        if any(variant in normalized for variant in variants):
            return rank
    return _NO_KEYWORD_RANK


def _sort_key(document: DceDocument) -> tuple:
    keyword_rank = _keyword_rank(document.nom_fichier)
    type_rank = _TYPE_FALLBACK_RANK.get(document.type_fichier, _DEFAULT_TYPE_RANK)
    # Les documents sans mot-clé reconnu sont départagés entre eux par leur type de
    # fichier ; ceux avec mot-clé priment toujours sur ceux sans, quel que soit le type.
    return (keyword_rank, type_rank, document.nom_fichier)


@dataclass
class BuiltContext:
    texte: str
    documents_inclus: list[str]  # noms de fichiers effectivement inclus (même partiellement)
    tronque: bool
    nb_caracteres_total: int


def build_context(db: Session, appel_offres_id: int, max_chars: int) -> BuiltContext:
    documents = (
        db.query(DceDocument)
        .filter(
            DceDocument.appel_offres_id == appel_offres_id,
            DceDocument.statut_extraction == "succes",
            DceDocument.texte_extrait_path.isnot(None),
        )
        .all()
    )
    documents.sort(key=_sort_key)

    # Plafond par document dynamique : proportionnel au nombre de documents éligibles,
    # plutôt qu'un tiers fixe du budget. Un fixe à 1/3 pénalisait injustement un DCE à
    # seulement 1-2 gros fichiers (chacun tronqué à 1/3 même si l'autre tiers du budget
    # restait inutilisé), et laissait trop de marge à un DCE avec beaucoup de petits
    # fichiers. Avec n documents, chacun a droit à max_chars / n au départ ; la seconde
    # borne (`remaining`, budget réellement restant) reste la garde-fou pour ne jamais
    # dépasser max_chars au total.
    per_document_cap = max(max_chars // max(len(documents), 1), 1)

    chunks: list[str] = []
    documents_inclus: list[str] = []
    total_chars = 0
    tronque = False

    for document in documents:
        try:
            with open(document.texte_extrait_path, "r", encoding="utf-8") as handle:
                text = handle.read()
        except OSError:
            continue

        if not text.strip():
            continue

        header = f"\n\n===== {document.nom_fichier} =====\n"
        remaining = max_chars - total_chars - len(header)

        if remaining <= 0:
            tronque = True
            break

        allowed = min(remaining, per_document_cap)
        if len(text) > allowed:
            text = text[:allowed]
            tronque = True  # au moins un document a été raccourci quelque part dans le contexte

        chunks.append(header + text)
        documents_inclus.append(document.nom_fichier)
        total_chars += len(header) + len(text)

    texte_final = "".join(chunks)
    if tronque:
        texte_final += _TRUNCATION_NOTICE

    return BuiltContext(
        texte=texte_final,
        documents_inclus=documents_inclus,
        tronque=tronque,
        nb_caracteres_total=total_chars,
    )