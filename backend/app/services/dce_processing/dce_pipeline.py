"""
Orchestrateur du pipeline de traitement d'un DCE déjà téléchargé.

Enchaîne : dézippage -> extraction de texte par fichier -> indexation (DceDocument)
-> construction du contexte priorisé -> appel LLM unique -> persistance (AnalyseDce).

Principe directeur : à chaque étape, un échec partiel ne doit jamais empêcher les
étapes suivantes de s'exécuter avec ce qui est disponible. Le pipeline produit
toujours un résultat (statut complete / partielle / echec) plutôt que de lever une
exception non gérée jusqu'au routeur.

Idempotent : peut être relancé pour le même AppelOffres (ex. après un échec LLM
temporaire) sans créer de doublons — les DceDocument et l'AnalyseDce sont réécrits.

Justification architecturale : Ce module implémente un pipeline ETL (Extract, Transform, Load) 
robuste. Il applique des principes de "Fail-Fast" pour les erreurs bloquantes (ex: zip corrompu) 
et de "Graceful Degradation" pour les erreurs locales (ex: un fichier illisible). 
Il gère également les contraintes d'état (state management) propres aux systèmes asynchrones 
et aux limites des modèles de langage (fenêtre de contexte).
"""
import json
import logging
import os
import threading
import time

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.appel_offres import AppelOffres
from app.models.analyse_dce import AnalyseDce
from app.services.dce_processing import zip_extractor, document_indexer, context_builder, ai_extractor
from app.services.dce_processing.zip_extractor import ZipExtractionError
from app.services.dce_processing.ai_extractor import EXPECTED_FIELDS
from app.services.acquisition.sync_orchestrator import download_dce_for

# DIAGNOSTIC 2 : Classification des champs par importance métier
# Les champs indispensables sont ceux qui rendent une analyse exploitable même sans les autres
CHAMPS_INDISPENSABLES = [
    "resume",              # Résumé exécutif - essentiel pour prise de décision
    "objet_marche",        # Objet du marché - fondamental
    "budget",              # Budget - critique pour évaluation
]

# Les champs importants mais contextuels (dépendent du contenu du DCE)
CHAMPS_IMPORTANTS = [
    "prestations_attendues",    # Définit le périmètre du marché
    "pieces_administratives",   # Obligations de candidature
    "delais_importants",         # Contraintes temporelles
]

# Les champs contextuels qui peuvent être absents naturellement
CHAMPS_CONTEXTUELS = [
    "competences_recherchees",   # Dépend du profil requis
    "technologies_mentionnees",   # Dépend des spécifications techniques
    "livrables_attendus",        # Dépend de la nature du marché
    "contraintes_importantes",   # Dépend des spécificités
    "criteres_evaluation",       # Dépend du type de procédure
    "points_vigilance",          # Analyse de risque
    "recommandations",           # Conseil d'expert
]

logger = logging.getLogger(__name__)

# CONTRÔLE DE CONCURRENCE (Resource-Level Mutex) : 
# SQLite ne supporte qu'un seul writer à la fois. Si deux requêtes HTTP tentent de traiter 
# le même AO simultanément, l'une d'elles planterait avec "database is locked".
# Plutôt qu'un verrou global (qui sérialiserait tout le pipeline et tuerait les performances), 
# on utilise un verrou par ressource (AppelOffres). Le dictionnaire est protégé par un verrou 
# global de lecture/écriture (_pipeline_locks_guard) pour éviter les conditions de course 
# lors de la création des verrous individuels.
_pipeline_locks_guard = threading.Lock()
_pipeline_locks: dict[int, threading.Lock] = {}


def _get_pipeline_lock(appel_offres_id: int) -> threading.Lock:
    """Récupère ou crée le verrou spécifique à un AppelOffres."""
    with _pipeline_locks_guard:
        if appel_offres_id not in _pipeline_locks:
            _pipeline_locks[appel_offres_id] = threading.Lock()
        return _pipeline_locks[appel_offres_id]


# SCHÉMA DE DONNÉES LLM : 
# Regroupement des champs attendus qui sont des listes. 
# Cela permet d'uniformiser la sérialisation (JSON) et la validation lors de la persistance, 
# en les distinguant des champs scalaires (strings). C'est une forme de "Schema Enforcement" 
# pour garantir que la sortie du LLM est correctement mappée au modèle de base de données.
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
    """
    Erreur bloquante avant même de démarrer le pipeline (précondition non remplie).
    Distinction importante : cette exception représente un échec du système de contrôle, 
    tandis que les échecs de traitement de documents sont capturés et logués sans lever d'exception.
    """


def _get_or_create_analyse(db: Session, appel_offres_id: int) -> AnalyseDce:
    """
    Pattern "Upsert" (Update or Insert). 
    Garantit qu'un enregistrement AnalyseDce existe toujours pour porter l'état du pipeline, 
    évitant ainsi des erreurs de type "NoneType" dans les étapes suivantes.
    """
    analyse = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
    if analyse is None:
        analyse = AnalyseDce(appel_offres_id=appel_offres_id, statut="en_attente")
        db.add(analyse)
    return analyse


def reset_analyses_bloquees(db: Session) -> int:
    """
    Récupération d'état (State Recovery) au démarrage.
    JUSTIFICATION : Dans un système monolithique ou sans worker distribué, un statut 'en_cours' au démarrage 
    est nécessairement un état orphelin (résidu d'un crash, OOM killer, ou arrêt brutal). 
    Cette fonction agit comme un "garbage collector" d'états pour éviter qu'un utilisateur ne soit 
    bloqué indéfiniment sur une interface de polling frontend.
    """
    bloquees = db.query(AnalyseDce).filter(AnalyseDce.statut == "en_cours").all()
    for analyse in bloquees:
        analyse.statut = "echec"
        analyse.erreur = (
            "Traitement interrompu par un redémarrage ou un arrêt du serveur. "
            "Relance l'analyse manuellement."
        )
    if bloquees:
        db.commit()
        logger.warning(f"[DIAG] {len(bloquees)} analyse(s) bloquée(s) en 'en_cours' réinitialisée(s) au démarrage.")
    return len(bloquees)


def _mark_failed(db: Session, analyse: AnalyseDce, message: str, nb_documents_analyses: int | None = None) -> AnalyseDce:
    """
    Transition d'état centralisée vers l'échec.
    Assure que chaque chemin d'erreur met à jour la base de données de manière atomique, 
    fournissant une source de vérité unique et cohérente pour le client (frontend).
    """
    analyse.statut = "echec"
    analyse.erreur = message
    if nb_documents_analyses is not None:
        analyse.nb_documents_analyses = nb_documents_analyses
    db.commit()
    db.refresh(analyse)
    return analyse


def run_pipeline(db: Session, appel_offres_id: int, force: bool = False) -> AnalyseDce:
    """
    Point d'entrée public avec garde de concurrence non-bloquante.
    CHOIX UX : `blocking=False` permet de ne pas mettre la requête HTTP en attente 
    si un traitement est déjà en cours. On retourne immédiatement l'état actuel, 
    ce qui est préférable pour une API web réactive.
    """
    lock = _get_pipeline_lock(appel_offres_id)
    if not lock.acquire(blocking=False):
        logger.warning(f"[DIAG] Traitement DCE déjà en cours pour AppelOffres {appel_offres_id} — appel ignoré.")
        existing = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
        if existing is not None:
            return existing
        raise DcePipelineError(f"Traitement déjà en cours pour AppelOffres {appel_offres_id}, réessaie dans quelques secondes.")

    try:
        return _run_pipeline_locked(db, appel_offres_id, force)
    finally:
        lock.release()


def _run_pipeline_locked(db: Session, appel_offres_id: int, force: bool = False) -> AnalyseDce:
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_offres_id).first()
    if appel is None:
        raise DcePipelineError(f"AppelOffres {appel_offres_id} introuvable.")

    # OPTIMISATION (Évaluation à court-circuit / Memoization) : 
    # Si l'analyse est déjà complète, on ne relance pas le pipeline (coûtreux en temps et en tokens LLM).
    # Le paramètre `force` permet de contourner ce cache pour les cas de re-jeu (debug, amélioration de prompt).
    existing = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
    if existing is not None and existing.statut == "complete" and not force:
        return existing

    # Instrumentation des performances - Début du chronométrage
    pipeline_start = time.time()
    logger.info(f"[PIPELINE] Début pipeline AO {appel_offres_id}")

    # Initialisation de l'état de traitement
    analyse = _get_or_create_analyse(db, appel_offres_id)
    analyse.statut = "en_cours"
    analyse.erreur = None
    db.commit()

    # --- ÉTAPE 0 : Lazy Loading (Téléchargement à la demande) ---
    # Le DCE n'est téléchargé que si l'utilisateur déclenche l'analyse. 
    # Cela économise de la bande passante et du stockage pour les AO qui ne seront jamais analysés.
    download_start = time.time()
    if not appel.url_cps:
        download_result = download_dce_for(db, appel_offres_id)
        download_end = time.time()
        logger.info(f"[PIPELINE] Téléchargement DCE : {download_end - download_start:.2f}s")
        if not download_result.get("success"):
            return _mark_failed(
                db, analyse,
                f"Téléchargement automatique du DCE échoué : {download_result.get('reason')}",
                nb_documents_analyses=0,
            )
        db.refresh(appel)  # url_cps vient d'être renseigné par download_dce_for
    else:
        download_end = time.time()
        logger.info(f"[PIPELINE] Téléchargement DCE : déjà disponible (0.00s)")

    # --- ÉTAPE 1 : Ingestion et Validation (Dézippage) ---
    # Fail-Fast : si le conteneur (ZIP) est corrompu, on arrête immédiatement. 
    # Inutile de consommer des ressources pour la suite.
    unzip_start = time.time()
    try:
        extracted_files = zip_extractor.extract_zip(appel_offres_id, appel.url_cps)
    except ZipExtractionError as exc:
        return _mark_failed(db, analyse, f"Échec du dézippage : {exc}", nb_documents_analyses=0)
    unzip_end = time.time()
    logger.info(f"[PIPELINE] Dézippage : {unzip_end - unzip_start:.2f}s, {len(extracted_files)} fichiers extraits")

    if not extracted_files:
        return _mark_failed(
            db, analyse,
            "Le zip du DCE ne contient aucun fichier exploitable (uniquement des dossiers ou des fichiers parasites).",
            nb_documents_analyses=0,
        )

    # --- ÉTAPE 2 : Extraction de features et Persistance (Texte + Indexation) ---
    # Cette étape est tolérante aux pannes. Même si 50% des fichiers échouent, 
    # les 50% restants sont indexés et serviront au contexte.
    extraction_start = time.time()
    output_dir = os.path.join(settings.dce_extracted_storage_path, str(appel_offres_id))
    document_indexer.index_documents(db, appel_offres_id, extracted_files, output_dir)
    extraction_end = time.time()
    logger.info(f"[PIPELINE] Extraction de texte + indexation : {extraction_end - extraction_start:.2f}s")

    # --- ÉTAPE 3 : Agrégation et Gestion de Fenêtre de Contexte ---
    # Les LLM ont une limite stricte de tokens (fenêtre de contexte). 
    # Cette étape agit comme un système de "Retrieval" : elle trie, pondère et tronque 
    # les documents pour maximiser la densité d'information utile tout en respectant la limite technique.
    context_start = time.time()
    built_context = context_builder.build_context(db, appel_offres_id, settings.dce_context_max_chars)
    context_end = time.time()
    logger.info(f"[PIPELINE] Construction contexte : {context_end - context_start:.2f}s")

    if not built_context.texte.strip():
        return _mark_failed(
            db, analyse,
            "Aucun texte exploitable n'a pu être extrait des documents du DCE "
            "(types non supportés, PDFs scannés, ou échecs d'extraction — voir le détail par document).",
            nb_documents_analyses=0,
        )

    # Traçabilité de la perte d'information due aux contraintes techniques
    if built_context.tronque:
        logger.warning(
            f"[DIAG] Contexte tronqué pour l'AO {appel_offres_id} : "
            f"{built_context.nb_caracteres_total}/{settings.dce_context_max_chars} caractères envoyés au LLM "
            f"({len(built_context.documents_inclus)} document(s) inclus). Au moins un document a été raccourci."
        )

    # --- ÉTAPE 4 : Inférence (Appel au modèle prédictif / LLM) ---
    # L'appel LLM retourne maintenant un fallback en cas d'erreur au lieu de lever une exception
    llm_start = time.time()
    result = ai_extractor.call_llm(appel, built_context.texte)
    llm_end = time.time()
    logger.info(f"[LLM] Appel LLM : {llm_end - llm_start:.2f}s")

    # --- ÉTAPE 5 : Structuration du résultat et Évaluation de la qualité ---
    # Mapping de la sortie JSON du LLM vers le modèle de base de données.
    analyse.resume = result.get("resume") or None
    analyse.objet_marche = result.get("objet_marche") or None
    
    # Sérialisation uniforme des champs de type liste pour le stockage en base (JSON)
    for field in _LIST_FIELDS:
        value = result.get(field)
        analyse.__setattr__(field, json.dumps(value if isinstance(value, list) else [], ensure_ascii=False))
        
    analyse.budget = result.get("budget") or None
    analyse.modele_utilise = settings.dce_analysis_model
    analyse.nb_documents_analyses = len(built_context.documents_inclus)
    analyse.contexte_tronque = built_context.tronque
    analyse.nb_caracteres_contexte = built_context.nb_caracteres_total

    # Évaluation de la complétude de la sortie du LLM (Data Quality Assessment)
    # On compte le nombre de champs attendus qui ont été effectivement remplis.
    filled_fields = sum(1 for field in EXPECTED_FIELDS if result.get(field))
    is_fallback = result.get("resume", "").startswith("Analyse automatique non disponible")

    # DIAGNOSTIC 1 : Audit détaillé des champs remplis
    logger.info(f"[DIAG-VALIDATION] === AUDIT COMPLÉTUDE CHAMPS ===")
    logger.info(f"[DIAG-VALIDATION] Nombre total de champs attendus: {len(EXPECTED_FIELDS)}")
    logger.info(f"[DIAG-VALIDATION] Nombre de champs remplis: {filled_fields}")
    logger.info(f"[DIAG-VALIDATION] Ratio: {filled_fields}/{len(EXPECTED_FIELDS)} ({filled_fields/len(EXPECTED_FIELDS)*100:.1f}%)")

    empty_fields = []
    for field in EXPECTED_FIELDS:
        value = result.get(field)
        is_empty = not value or (isinstance(value, list) and len(value) == 0)
        if is_empty:
            empty_fields.append(field)
            logger.info(f"[DIAG-VALIDATION] Champ VIDE: {field} (valeur: {repr(value)})")
        else:
            # Calcul de la taille selon le type
            if isinstance(value, str):
                taille = len(str(value))
            elif isinstance(value, list):
                taille = len(value)
            else:
                taille = "N/A"
            logger.info(f"[DIAG-VALIDATION] Champ REMPLI: {field} (type: {type(value).__name__}, taille: {taille})")

    if empty_fields:
        logger.info(f"[DIAG-VALIDATION] Champs vides: {empty_fields}")

    # DIAGNOSTIC 2 : Audit de la logique métier actuelle
    logger.info(f"[DIAG-METIER] === AUDIT LOGIQUE MÉTIER ===")
    logger.info(f"[DIAG-METIER] Règle actuelle: filled_fields < len(EXPECTED_FIELDS) → statut='partielle'")
    logger.info(f"[DIAG-METIER] Champ contextuels vides: {[f for f in empty_fields if f in CHAMPS_CONTEXTUELS]}")
    logger.info(f"[DIAG-METIER] Champs indispensables vides: {[f for f in empty_fields if f in CHAMPS_INDISPENSABLES]}")

    # Évaluation basée sur les champs indispensables
    indispensable_filled = sum(1 for field in CHAMPS_INDISPENSABLES if result.get(field))
    logger.info(f"[DIAG-METIER] Champs indispensables remplis: {indispensable_filled}/{len(CHAMPS_INDISPENSABLES)}")

    # DIAGNOSTIC 4 : Identification de la cause réelle du statut
    cause_statut = ""
    if is_fallback:
        cause_statut = "LLM échoué (fallback utilisé)"
    elif filled_fields == 0:
        cause_statut = "LLM n'a extrait aucune information"
    elif indispensable_filled < len(CHAMPS_INDISPENSABLES):
        cause_statut = "Champs indispensables manquants"
    elif filled_fields < len(EXPECTED_FIELDS):
        cause_statut = "Champs contextuels manquants (non problématique)"
    else:
        cause_statut = "Extraction complète"

    logger.info(f"[DIAG-STATUT] === DÉTERMINATION STATUT FINAL ===")
    logger.info(f"[DIAG-STATUT] Cause: {cause_statut}")
    logger.info(f"[DIAG-STATUT] Statut assigné: {analyse.statut}")
    if analyse.erreur:
        logger.info(f"[DIAG-STATUT] Message erreur: {analyse.erreur}")

    if is_fallback:
        # Fallback utilisé (LLM échoué)
        analyse.statut = "partielle"
        analyse.erreur = "L'analyse automatique par IA n'a pas pu être complétée (erreur serveur ou API). Les informations affichées sont basiques. Veuillez consulter manuellement les documents."
    elif filled_fields == 0:
        # Hallucination négative ou échec total du modèle à comprendre le contexte
        analyse.statut = "echec"
        analyse.erreur = "Le LLM n'a retourné aucune information exploitable pour ce DCE."
    elif filled_fields < len(EXPECTED_FIELDS):
        # Extraction partielle (certains champs manquent, mais le résultat a de la valeur)
        analyse.statut = "partielle"
        analyse.erreur = None
    else:
        # Extraction complète et conforme au schéma
        analyse.statut = "complete"
        analyse.erreur = None

    # Instrumentation des performances - Fin du chronométrage
    validation_start = time.time()
    db.commit()
    db.refresh(analyse)
    validation_end = time.time()
    
    pipeline_end = time.time()
    total_duration = pipeline_end - pipeline_start
    
    logger.info(f"[PIPELINE] Validation + persistance : {validation_end - validation_start:.2f}s")
    logger.info(f"[PIPELINE] === SYNTHÈSE PERFORMANCES ===")
    logger.info(f"[PIPELINE] Durée totale pipeline : {total_duration:.2f}s")
    logger.info(f"[PIPELINE] Répartition : téléchargement={download_end - download_start:.2f}s, dézippage={unzip_end - unzip_start:.2f}s, extraction={extraction_end - extraction_start:.2f}s, contexte={context_end - context_start:.2f}s, LLM={llm_end - llm_start:.2f}s, validation={validation_end - validation_start:.2f}s")
    
    return analyse
