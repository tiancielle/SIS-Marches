"""
Assemble le contexte texte envoyé au LLM à partir des DceDocument déjà indexés.

Stratégie de priorisation (décidée avec l'utilisateur) : priorité par mots-clés
métier reconnus dans le nom du fichier (CPS, RC, Acte d'engagement, CCAP, CCTP,
BPU, DQE...), plus proche du réflexe d'un bureau d'études que d'un simple tri par
extension. Si aucun mot-clé n'est détecté, repli sur le type de fichier
(PDF > DOCX > DOC > XLSX > autre).

Troncature : on extrait toujours les documents intégralement (voir text_extractor),
la troncature n'intervient qu'ici, au niveau du texte assemblé pour le LLM.

Justification architecturale : Ce module joue le rôle d'un système de Retrieval 
Augmented Generation (RAG) simplifié mais hautement optimisé pour le domaine des 
marchés publics. Plutôt que de soumettre aveuglément tous les documents au LLM 
(ce qui diluerait l'attention du modèle et gaspillerait des tokens), on applique 
une heuristique de pondération métier pour maximiser la densité d'information 
pertinente dans la fenêtre de contexte limitée.
"""
import unicodedata
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.dce_document import DceDocument

# HEURISTIQUE DE PRIORISATION MÉTIER :
# Les marchés publics ont une structure sémantique forte. Le CPS et le RC contiennent 
# ~80% des informations décisionnelles (critères, délais, contraintes). 
# En ordonnant ces mots-clés du plus au moins prioritaire, on garantit que les 
# documents les plus denses en informations stratégiques sont injectés en premier 
# dans le contexte du LLM, optimisant ainsi la qualité de l'inférence.
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

# REPLI STRUCTURAL :
# Si aucun mot-clé métier n'est détecté dans le nom du fichier, on utilise le type 
# de fichier comme proxy de richesse informationnelle. Les PDF et DOCX sont généralement 
# plus structurés et porteurs de texte que les DOC legacy ou les XLSX (souvent des tableaux 
# bruts moins pertinents pour une analyse sémantique globale).
_TYPE_FALLBACK_RANK = {"pdf": 0, "docx": 1, "doc": 2, "xlsx": 3}
_DEFAULT_TYPE_RANK = 4
_NO_KEYWORD_RANK = len(_KEYWORD_PRIORITY)  # rang réservé aux fichiers sans mot-clé reconnu

# MARQUEUR DE TRONCATURE :
# Signal explicite injecté dans le prompt pour informer le LLM que le contexte a été 
# coupé. Cela aide le modèle à comprendre qu'il ne doit pas halluciner la fin des 
# documents manquants et qu'il base son analyse sur un extrait.
_TRUNCATION_NOTICE = "\n\n[... contenu tronqué, limite de contexte atteinte ...]\n"


def _normalize(text: str) -> str:
    """
    Normalisation robuste des chaînes de caractères pour la correspondance de motifs.
    
    JUSTIFICATION : Les noms de fichiers dans les DCE sont souvent mal formatés 
    (accents manquants, majuscules aléatoires, espaces multiples). La normalisation 
    NFKD décompose les caractères accentués (ex: 'é' -> 'e' + '´'), permettant de 
    les filtrer et d'assurer une correspondance insensible aux accents et à la casse, 
    augmentant ainsi le taux de détection des mots-clés métier.
    """
    decomposed = unicodedata.normalize("NFKD", text)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_accents.lower()


def _keyword_rank(nom_fichier: str) -> int:
    """
    Évalue la priorité d'un fichier en fonction de la présence de mots-clés métier.
    Retourne l'indice de la première correspondance trouvée dans la liste priorisée, 
    ou un rang par défaut si aucun mot-clé n'est reconnu.
    """
    normalized = _normalize(nom_fichier)
    for rank, variants in enumerate(_KEYWORD_PRIORITY):
        if any(variant in normalized for variant in variants):
            return rank
    return _NO_KEYWORD_RANK


def _sort_key(document: DceDocument) -> tuple:
    """
    Clé de tri composite pour l'ordonnancement des documents.
    
    LOGIQUE DE DÉPARTAGE : 
    1. `keyword_rank` : Les documents avec un mot-clé métier priment toujours.
    2. `type_rank` : À mot-clé égal (ou absent), le type de fichier départage.
    3. `nom_fichier` : Pour garantir un ordre déterministe et reproductible (stable sort) 
       en cas d'égalité parfaite, ce qui est une bonne pratique en ingénierie des données.
    """
    keyword_rank = _keyword_rank(document.nom_fichier)
    type_rank = _TYPE_FALLBACK_RANK.get(document.type_fichier, _DEFAULT_TYPE_RANK)
    return (keyword_rank, type_rank, document.nom_fichier)


@dataclass
class BuiltContext:
    """
    Contrat de données retourné par le builder.
    La séparation entre le texte brut et les métadonnées de construction (`tronque`, 
    `documents_inclus`) est cruciale pour l'observabilité du pipeline et le débogage 
    des réponses du LLM (permet de savoir si une information manquante était due à 
    une troncature ou à une absence réelle dans le DCE).
    """
    texte: str
    documents_inclus: list[str]  # noms de fichiers effectivement inclus (même partiellement)
    tronque: bool
    nb_caracteres_total: int


def build_context(db: Session, appel_offres_id: int, max_chars: int) -> BuiltContext:
    """
    Construit le contexte optimisé pour le LLM.
    
    FILTRAGE PRÉALABLE : On ne récupère que les documents dont l'extraction a réussi 
    et qui contiennent effectivement du texte, évitant de gaspiller du budget de contexte 
    avec des fichiers vides ou corrompus.
    """
    documents = (
        db.query(DceDocument)
        .filter(
            DceDocument.appel_offres_id == appel_offres_id,
            DceDocument.statut_extraction == "succes",
            DceDocument.texte_extrait_path.isnot(None),
        )
        .all()
    )
    
    # Ordonnancement selon l'heuristique de priorité métier définie plus haut.
    documents.sort(key=_sort_key)

    # ALLOCATION DYNAMIQUE DU BUDGET DE CONTEXTE (Fair Share Algorithm) :
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
        # TOLÉRANCE AUX PANNES (Fault Tolerance) : 
        # Un fichier texte supprimé ou inaccessible sur le disque ne doit pas faire 
        # échouer l'assemblage du contexte global. On ignore silencieusement l'erreur 
        # et on passe au document suivant (dégradation gracieuse).
        try:
            with open(document.texte_extrait_path, "r", encoding="utf-8") as handle:
                text = handle.read()
        except OSError:
            continue

        if not text.strip():
            continue

        header = f"\n\n===== {document.nom_fichier} =====\n"
        remaining = max_chars - total_chars - len(header)

        # CONDITION D'ARRÊT (Fail-Fast) : 
        # Si le budget de caractères est épuisé, on arrête immédiatement la boucle.
        if remaining <= 0:
            tronque = True
            break

        # La quantité de texte autorisée est le minimum entre le reste du budget global 
        # et le quota équitable alloué à ce document.
        allowed = min(remaining, per_document_cap)
        if len(text) > allowed:
            text = text[:allowed]
            tronque = True  # au moins un document a été raccourci quelque part dans le contexte

        chunks.append(header + text)
        documents_inclus.append(document.nom_fichier)
        total_chars += len(header) + len(text)

    texte_final = "".join(chunks)
    if tronque:
        # Injection du marqueur pour maintenir l'honnêteté du prompt vis-à-vis du LLM.
        texte_final += _TRUNCATION_NOTICE

    return BuiltContext(
        texte=texte_final,
        documents_inclus=documents_inclus,
        tronque=tronque,
        nb_caracteres_total=total_chars,
    )