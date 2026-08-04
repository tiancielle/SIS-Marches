"""
Un seul appel LLM par DCE, pour produire une extraction structurée en JSON strict
à partir du contexte texte assemblé.

Fournisseur par défaut : Gemini (via l'endpoint de compatibilité OpenAI de Google),
gratuit sans carte bancaire et sans date de fin annoncée — contrairement à GitHub
Models, dont l'arrêt définitif est prévu le 30 juillet 2026.

Justification architecturale : Ce module agit comme le moteur d'inférence du pipeline.
Il est conçu pour maximiser la fiabilité de l'extraction d'entités (Named Entity Recognition 
étendue) tout en minimisant les coûts et les risques de dépendance à un fournisseur 
dont le service pourrait être déprécié. L'approche "Single Shot" (un seul appel) optimise 
la latence et la consommation de tokens, en s'appuyant sur un contexte préalablement 
filtré et hiérarchisé par le `context_builder`.
"""
import json
import re
import logging

from openai import OpenAI, RateLimitError, APIError, APIConnectionError

from app.core.config import settings
from app.models.appel_offres import AppelOffres

# ABSTRACTION DU FOURNISSEUR : 
# L'utilisation d'un dictionnaire de URLs permet de changer de provider (Gemini, GitHub, etc.) 
# via une simple variable d'environnement, sans modifier le code. Cela garantit la pérennité 
# du système face aux changements de politique des API (ex: fin de vie d'un service).
_PROVIDER_BASE_URLS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "github_models": "https://models.github.ai/inference",
}

# SCHÉMA DE DONNÉES ATTENDU :
# Cette liste sert de référence pour l'évaluation de la complétude des données en aval 
# (dans le pipeline). Elle garantit que le contrat d'interface entre le LLM et la base 
# de données est respecté.
EXPECTED_FIELDS = [
    "resume",
    "objet_marche",
    "prestations_attendues",
    "competences_recherchees",
    "technologies_mentionnees",
    "pieces_administratives",
    "livrables_attendus",
    "contraintes_importantes",
    "criteres_evaluation",
    "delais_importants",
    "points_vigilance",
    "recommandations",
    "budget",
]

# INGÉNIERIE DE PROMPT : RÔLE ET CONTRAINTES NÉGATIVES
# L'attribution d'un rôle ("consultant senior") ancre le modèle dans un registre lexical 
# professionnel. Les contraintes négatives ("n'invente jamais", "ne suppose jamais") sont 
# cruciales pour l'atténuation des hallucinations (hallucination mitigation), un enjeu 
# majeur en extraction de données structurées à partir de documents réels.
_SYSTEM_PROMPT = (
    "Tu es un consultant senior en bureau d'études qui analyse des dossiers de "
    "consultation de marchés publics marocains (DCE) pour évaluer leur pertinence "
    "et préparer une candidature. Réponds UNIQUEMENT avec un objet JSON valide, "
    "sans texte avant ou après, sans balises markdown. Si une information n'est "
    "pas présente dans le texte fourni, utilise une liste vide ([]) ou null selon "
    "le type attendu — n'invente jamais de valeur, ne suppose jamais un contenu "
    "qui ne serait pas explicitement dans le texte fourni."
)

# SCHÉMA D'EXTRACTION STRUCTURÉE :
# Plutôt que de laisser le modèle deviner le format, on lui fournit un "few-shot" implicite 
# via la description détaillée de chaque clé. Cela guide le raisonnement du modèle pour 
# qu'il extraie des informations actionnables (ex: distinguer "prestations" de "livrables"), 
# ce qui est essentiel pour la qualité des données (Data Quality) en aval.
_JSON_SCHEMA_INSTRUCTIONS = """
Structure JSON attendue, exactement ces clés :
{
  "resume": "résumé exécutif détaillé en 8-12 phrases, à destination d'un décideur qui doit comprendre le marché sans lire le CPS en entier : nature précise du marché, contexte/localisation, principales prestations attendues, profil d'équipe requis, montant si connu, délais clés, et tout élément déterminant pour la décision de candidater (contrainte forte, spécificité notable). Reste factuel, ne répète pas mot pour mot objet_marche.",
  "objet_marche": "reformulation claire et précise de l'objet du marché, une à deux phrases",
  "prestations_attendues": ["liste des prestations/missions concrètes attendues du prestataire"],
  "competences_recherchees": ["liste de compétences/profils recherchés"],
  "technologies_mentionnees": ["liste de technologies, normes, logiciels mentionnés"],
  "pieces_administratives": ["liste des pièces administratives demandées au soumissionnaire pour candidater (acte d'engagement, RC, CPS signé, attestations fiscale/CNSS, certificats de qualification, etc.)"],
  "livrables_attendus": ["liste des livrables concrets attendus en cours/fin de mission (rapports, plans, études, formations...)"],
  "contraintes_importantes": ["liste des contraintes notables : délais d'exécution, pénalités, exigences de qualification/références, garanties, cautionnement, lieu d'exécution..."],
  "criteres_evaluation": ["liste des critères d'évaluation des offres, ex: technique 60% / prix 40%"],
  "delais_importants": [{"libelle": "date limite de remise des plis", "date": "JJ/MM/AAAA ou texte tel que trouvé"}],
  "points_vigilance": ["liste des points de vigilance ou risques identifiés pour un candidat (ambiguïtés du CPS, exigences difficiles à satisfaire, délais courts, concurrence attendue, clauses défavorables...)"],
  "recommandations": ["liste de recommandations concrètes pour SIS Consultants : candidater ou non, points à clarifier avant de candidater, partenariats/sous-traitance à envisager..."],
  "budget": "budget/montant estimatif si mentionné, sous forme de texte, sinon null"
}
"""


class DceAiError(Exception):
    """Erreur générique lors de l'appel ou du parsing LLM."""


class DceAiRateLimitError(DceAiError):
    """
    Limite de débit atteinte côté fournisseur (ex: tier gratuit).
    Séparer cette exception permet au pipeline de distinguer une erreur transitoire 
    (qu'on pourrait retry plus tard) d'une erreur structurelle (prompt invalide, API down).
    """


def _get_client() -> OpenAI:
    """
    Fabrique (Factory) du client API.
    Centralise la logique de configuration, permettant d'injecter les bonnes 
    credentials et le bon endpoint en fonction des variables d'environnement.
    """
    base_url = _PROVIDER_BASE_URLS.get(settings.llm_provider, _PROVIDER_BASE_URLS["gemini"])
    api_key = settings.gemini_api_key if settings.llm_provider == "gemini" else settings.github_models_token
    return OpenAI(base_url=base_url, api_key=api_key)


def _build_prompt(appel: AppelOffres, context_text: str) -> str:
    """
    Construction du prompt avec injection de métadonnées (Prompt Grounding).
    Fournir la référence, l'objet et l'organisme en en-tête aide le modèle à 
    contextualiser le texte brut qui suit, améliorant la précision de l'extraction 
    des entités nommées et des relations.
    """
    entete = (
        f"Référence du marché : {appel.reference}\n"
        f"Objet (portail) : {appel.objet or 'non renseigné'}\n"
        f"Organisme : {appel.organisme or 'non renseigné'}\n"
        f"Type de procédure : {appel.type_procedure or 'non renseigné'}\n"
    )
    return (
        f"{entete}\n"
        f"{_JSON_SCHEMA_INSTRUCTIONS}\n"
        f"Voici le contenu extrait des documents du DCE (CPS, RC, actes, bordereaux...) :\n"
        f"-----\n{context_text}\n-----\n"
    )


def _strip_code_fences(raw: str) -> str:
    """
    Heuristique de nettoyage post-génération (Programmation défensive).
    Malgré les consignes strictes ("sans balises markdown"), les modèles de langage 
    sont probabilistes et ajoutent souvent des blocs ```json. Cette expression régulière 
    assure un parsing JSON robuste en isolant le contenu utile, évitant un échec du 
    pipeline pour un détail de formatage cosmétique.
    """
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
    return match.group(1) if match else raw


def _create_fallback_analysis(appel: AppelOffres) -> dict:
    """
    Crée une analyse par défaut quand le LLM échoue.
    Permet de dégrader proprement au lieu de planter complètement.
    """
    return {
        "resume": f"Analyse automatique non disponible pour l'appel d'offres {appel.reference}. Veuillez consulter manuellement les documents.",
        "objet_marche": appel.objet or "Objet non communiqué",
        "prestations_attendues": [],
        "competences_recherchees": [],
        "technologies_mentionnees": [],
        "pieces_administratives": [],
        "livrables_attendus": [],
        "contraintes_importantes": [],
        "criteres_evaluation": [],
        "delais_importants": [],
        "points_vigilance": [],
        "recommandations": [],
        "budget": None,
    }


def call_llm(appel: AppelOffres, context_text: str) -> dict:
    """
    Point d'entrée de l'inférence.
    Appelle le LLM et retourne le dict JSON parsé. En cas d'échec,
    retourne une analyse par défaut (fallback) pour éviter un crash complet.
    """
    client = _get_client()
    prompt = _build_prompt(appel, context_text)

    try:
        response = client.chat.completions.create(
            model=settings.dce_analysis_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            # RÉGLAGE DE L'ENTROPIE : Une température basse (0.2) est impérative pour 
            # des tâches d'extraction de données. Elle réduit la créativité du modèle 
            # au profit de la détermination et de la fidélité au texte source.
            temperature=0.2,
            max_tokens=settings.dce_llm_max_output_tokens,
        )
    except RateLimitError as exc:
        # Erreur transitoire de quota : on retourne un fallback au lieu de lever une exception
        logging.getLogger(__name__).warning(
            "[DIAG] Limite de débit atteinte pour AO %s : %s. Utilisation du fallback.",
            appel.id, exc
        )
        return _create_fallback_analysis(appel)
    except (APIError, APIConnectionError) as exc:
        # Erreur d'infrastructure ou de réseau : on retourne un fallback
        logging.getLogger(__name__).warning(
            "[DIAG] Erreur API pour AO %s : %s. Utilisation du fallback.",
            appel.id, exc
        )
        return _create_fallback_analysis(appel)
    except Exception as exc:  # noqa: BLE001
        # Filet de sécurité ultime : on capture TOUT pour éviter qu'une exception 
        # non prévue (ex: problème de sérialisation interne) ne fasse crasher le serveur.
        logging.getLogger(__name__).error(
            "[DIAG] Erreur inattendue lors de l'appel LLM pour AO %s : %s. Utilisation du fallback.",
            appel.id, exc
        )
        return _create_fallback_analysis(appel)

    raw_content = response.choices[0].message.content if response.choices else None
    if not raw_content:
        logging.getLogger(__name__).warning(
            "[DIAG] Réponse LLM vide pour AO %s. Utilisation du fallback.",
            appel.id
        )
        return _create_fallback_analysis(appel)

    try:
        # Validation et assainissement des données : on tente de parser le JSON 
        # après avoir appliqué notre heuristique de nettoyage des balises markdown.
        parsed = json.loads(_strip_code_fences(raw_content))
    except json.JSONDecodeError as exc:
        # OBSERVABILITÉ CONTRÔLÉE : En cas d'échec de parsing, on loggue le début 
        # de la réponse brute (500 caractères). Cela suffit généralement à déboguer 
        # un prompt défaillant, tout en évitant de saturer les logs ou la mémoire 
        # avec des réponses LLM potentiellement énormes et malformées.
        logging.getLogger(__name__).error(
            "[DIAG] Réponse LLM non-JSON pour AO %s. finish_reason=%s. Contenu brut (500 premiers car.) : %r. Utilisation du fallback.",
            appel.id,
            response.choices[0].finish_reason if response.choices else "?",
            raw_content[:500],
        )
        return _create_fallback_analysis(appel)

    # VÉRIFICATION DE TYPE : On s'assure que la racine du JSON est bien un objet (dict) 
    # et non un tableau ou un scalaire, respectant ainsi le contrat de l'API.
    if not isinstance(parsed, dict):
        logging.getLogger(__name__).warning(
            "[DIAG] Réponse LLM JSON valide mais pas un objet pour AO %s. Utilisation du fallback.",
            appel.id
        )
        return _create_fallback_analysis(appel)

    return parsed
