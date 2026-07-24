"""Un seul appel LLM par DCE, pour produire une extraction structurée en JSON strict
à partir du contexte texte assemblé.

Fournisseur par défaut : Gemini (via l'endpoint de compatibilité OpenAI de Google),
gratuit sans carte bancaire et sans date de fin annoncée — contrairement à GitHub
Models, dont l'arrêt définitif est prévu le 30 juillet 2026.
"""
import json
import re

from openai import OpenAI, RateLimitError, APIError, APIConnectionError

from app.core.config import settings
from app.models.appel_offres import AppelOffres

_PROVIDER_BASE_URLS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "github_models": "https://models.github.ai/inference",
}

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

_SYSTEM_PROMPT = (
    "Tu es un consultant senior en bureau d'études qui analyse des dossiers de "
    "consultation de marchés publics marocains (DCE) pour évaluer leur pertinence "
    "et préparer une candidature. Réponds UNIQUEMENT avec un objet JSON valide, "
    "sans texte avant ou après, sans balises markdown. Si une information n'est "
    "pas présente dans le texte fourni, utilise une liste vide ([]) ou null selon "
    "le type attendu — n'invente jamais de valeur, ne suppose jamais un contenu "
    "qui ne serait pas explicitement dans le texte fourni."
)

_JSON_SCHEMA_INSTRUCTIONS = """
Structure JSON attendue, exactement ces clés :
{
  "resume": "résumé exécutif clair et synthétique en 3-5 phrases, à destination d'un décideur pressé",
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
    """Limite de débit atteinte côté GitHub Models (tier gratuit, quelques req/min)."""


def _get_client() -> OpenAI:
    base_url = _PROVIDER_BASE_URLS.get(settings.llm_provider, _PROVIDER_BASE_URLS["gemini"])
    api_key = settings.gemini_api_key if settings.llm_provider == "gemini" else settings.github_models_token
    return OpenAI(base_url=base_url, api_key=api_key)


def _build_prompt(appel: AppelOffres, context_text: str) -> str:
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
    """Filet de sécurité : certains modèles ajoutent des balises ```json malgré la
    consigne système. On les retire avant de parser."""
    match = re.search(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL)
    return match.group(1) if match else raw


def call_llm(appel: AppelOffres, context_text: str) -> dict:
    """Appelle le LLM et retourne le dict JSON parsé. Lève DceAiRateLimitError ou
    DceAiError en cas d'échec — à charge de l'appelant de dégrader proprement."""
    client = _get_client()
    prompt = _build_prompt(appel, context_text)

    try:
        response = client.chat.completions.create(
            model=settings.dce_analysis_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=settings.dce_llm_max_output_tokens,
        )
    except RateLimitError as exc:
        raise DceAiRateLimitError(f"Limite de débit GitHub Models atteinte : {exc}") from exc
    except (APIError, APIConnectionError) as exc:
        raise DceAiError(f"Erreur API GitHub Models : {exc}") from exc
    except Exception as exc:  # noqa: BLE001 — on ne veut jamais planter le pipeline sur un appel réseau
        raise DceAiError(f"Erreur inattendue lors de l'appel LLM : {exc}") from exc

    raw_content = response.choices[0].message.content if response.choices else None
    if not raw_content:
        raise DceAiError("Réponse LLM vide.")

    try:
        parsed = json.loads(_strip_code_fences(raw_content))
    except json.JSONDecodeError as exc:
        raise DceAiError(f"Réponse LLM non-JSON : {exc}") from exc

    if not isinstance(parsed, dict):
        raise DceAiError("Réponse LLM JSON valide mais pas un objet.")

    return parsed