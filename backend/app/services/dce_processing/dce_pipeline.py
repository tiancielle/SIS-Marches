"""Orchestrateur du pipeline de traitement d'un DCE déjà téléchargé.

Enchaîne : dézippage -> extraction de texte par fichier -> indexation (DceDocument)
-> construction du contexte priorisé -> appel LLM unique -> persistance (AnalyseDce).

Principe directeur : à chaque étape, un échec partiel ne doit jamais empêcher les
étapes suivantes de s'exécuter avec ce qui est disponible. Le pipeline produit
toujours un résultat (statut complete / partielle / echec) plutôt que de lever une
exception non gérée jusqu'au routeur.

Idempotent : peut être relancé pour le même AppelOffres (ex. après un échec LLM
temporaire) sans créer de doublons — les DceDocument et l'AnalyseDce sont réécrits.
"""
import json
import os

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.appel_offres import AppelOffres
from app.models.analyse_dce import AnalyseDce
from app.services.dce_processing import zip_extractor, document_indexer, context_builder, ai_extractor
from app.services.dce_processing.zip_extractor import ZipExtractionError
from app.services.dce_processing.ai_extractor import DceAiError, DceAiRateLimitError, EXPECTED_FIELDS
from app.services.acquisition.sync_orchestrator import download_dce_for

_LIST_FIELDS = {
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
}


class DcePipelineError(Exception):
    """Erreur bloquante avant même de démarrer le pipeline (précondition non remplie)."""


def _get_or_create_analyse(db: Session, appel_offres_id: int) -> AnalyseDce:
    analyse = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
    if analyse is None:
        analyse = AnalyseDce(appel_offres_id=appel_offres_id, statut="en_attente")
        db.add(analyse)
    return analyse


def _mark_failed(db: Session, analyse: AnalyseDce, message: str, nb_documents_analyses: int | None = None) -> AnalyseDce:
    analyse.statut = "echec"
    analyse.erreur = message
    if nb_documents_analyses is not None:
        analyse.nb_documents_analyses = nb_documents_analyses
    db.commit()
    db.refresh(analyse)
    return analyse


def run_pipeline(db: Session, appel_offres_id: int, force: bool = False) -> AnalyseDce:
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_offres_id).first()
    if appel is None:
        raise DcePipelineError(f"AppelOffres {appel_offres_id} introuvable.")

    # Cache : une analyse déjà complète n'est jamais relancée (donc jamais un nouvel
    # appel LLM) sauf demande explicite via force=True (point 3 de l'audit).
    existing = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
    if existing is not None and existing.statut == "complete" and not force:
        return existing

    analyse = _get_or_create_analyse(db, appel_offres_id)
    analyse.statut = "en_cours"
    analyse.erreur = None
    db.commit()

    # 0. Téléchargement à la demande si pas encore en cache (Cas 2 du lazy loading :
    # "Analyser avec l'IA" doit déclencher le téléchargement en transparence, sans
    # que l'utilisateur ait besoin de passer par /telecharger-dce au préalable).
    if not appel.url_cps:
        download_result = download_dce_for(db, appel_offres_id)
        if not download_result.get("success"):
            return _mark_failed(
                db, analyse,
                f"Téléchargement automatique du DCE échoué : {download_result.get('reason')}",
                nb_documents_analyses=0,
            )
        db.refresh(appel)  # url_cps vient d'être renseigné par download_dce_for

    # 1. Dézippage
    try:
        extracted_files = zip_extractor.extract_zip(appel_offres_id, appel.url_cps)
    except ZipExtractionError as exc:
        return _mark_failed(db, analyse, f"Échec du dézippage : {exc}", nb_documents_analyses=0)

    if not extracted_files:
        return _mark_failed(
            db, analyse,
            "Le zip du DCE ne contient aucun fichier exploitable (uniquement des dossiers ou des fichiers parasites).",
            nb_documents_analyses=0,
        )

    # 2. Extraction de texte + indexation (tolérante aux échecs fichier par fichier)
    output_dir = os.path.join(settings.dce_extracted_storage_path, str(appel_offres_id))
    document_indexer.index_documents(db, appel_offres_id, extracted_files, output_dir)

    # 3. Construction du contexte priorisé
    built_context = context_builder.build_context(db, appel_offres_id, settings.dce_context_max_chars)

    if not built_context.texte.strip():
        return _mark_failed(
            db, analyse,
            "Aucun texte exploitable n'a pu être extrait des documents du DCE "
            "(types non supportés, PDFs scannés, ou échecs d'extraction — voir le détail par document).",
            nb_documents_analyses=0,
        )

    # 4. Appel LLM unique
    try:
        result = ai_extractor.call_llm(appel, built_context.texte)
    except DceAiRateLimitError as exc:
        return _mark_failed(db, analyse, str(exc), nb_documents_analyses=len(built_context.documents_inclus))
    except DceAiError as exc:
        return _mark_failed(db, analyse, str(exc), nb_documents_analyses=len(built_context.documents_inclus))

    # 5. Persistance du résultat structuré
    analyse.resume = result.get("resume") or None
    analyse.objet_marche = result.get("objet_marche") or None
    for field in _LIST_FIELDS:
        value = result.get(field)
        analyse.__setattr__(field, json.dumps(value if isinstance(value, list) else [], ensure_ascii=False))
    analyse.budget = result.get("budget") or None
    analyse.modele_utilise = settings.dce_analysis_model
    analyse.nb_documents_analyses = len(built_context.documents_inclus)

    filled_fields = sum(1 for field in EXPECTED_FIELDS if result.get(field))
    if filled_fields == 0:
        analyse.statut = "echec"
        analyse.erreur = "Le LLM n'a retourné aucune information exploitable pour ce DCE."
    elif filled_fields < len(EXPECTED_FIELDS):
        analyse.statut = "partielle"
        analyse.erreur = None
    else:
        analyse.statut = "complete"
        analyse.erreur = None

    db.commit()
    db.refresh(analyse)
    return analyse