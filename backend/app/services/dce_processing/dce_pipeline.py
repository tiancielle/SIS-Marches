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


def _is_cps_file(nom_fichier: str) -> bool:
    """
    Vérifie si le fichier est le CPS par son nom (Niveau 1).
    """
    nom_lower = nom_fichier.lower()
    
    if "cps" in nom_lower:
        return True
    
    if "ao" in nom_lower or "appel" in nom_lower:
        cps_keywords = ["consultation", "reglement", "cahier", "detail", "charges"]
        if any(keyword in nom_lower for keyword in cps_keywords):
            return True
    
    cps_keywords = ["consultation", "reglement", "cahier des charges", "cdc"]
    if any(keyword in nom_lower for keyword in cps_keywords):
        return True
    
    return False


def _find_cps_candidates(extracted_files: list) -> list:
    """
    Cherche des candidats CPS suspects parmi les fichiers extraits (Niveau 2).
    """
    candidates = []
    
    for extracted_file in extracted_files:
        if extracted_file.extension != "pdf":
            continue
        
        if extracted_file.taille_octets < 1024 * 1024:
            continue
        
        nom_lower = extracted_file.nom_fichier.lower()
        suspect_keywords = ["ao", "appel", "caf", "ctp", "detail", "cahier", "consultation", "reglement"]
        has_suspect_name = any(keyword in nom_lower for keyword in suspect_keywords)
        
        score = extracted_file.taille_octets
        if has_suspect_name:
            score *= 1.5
        
        candidates.append({
            "file": extracted_file,
            "score": score,
            "taille": extracted_file.taille_octets,
            "has_suspect_name": has_suspect_name
        })
    
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:3]


def _verify_cps_candidate(candidate: dict, output_dir: str) -> tuple[bool, int]:
    """
    Vérifie si un candidat est vraiment le CPS en analysant sa première page (Niveau 3).
    """
    extracted_file = candidate["file"]
    
    try:
        import fitz
        import tempfile
        import os
    except ImportError:
        return False, 0
    
    logger.info(f"[CPS-DETECT] Vérification première page : {extracted_file.nom_fichier}")
    
    try:
        doc = fitz.open(extracted_file.absolute_path)
        page = doc[0]
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            pix = page.get_pixmap(dpi=200)
            pix.save(tmp.name)
            page_img_path = tmp.name
        
        doc.close()
        
        try:
            from paddleocr import PaddleOCR
            ocr = PaddleOCR(
                lang='fr',
                text_detection_model_name="PP-OCRv6_small_det",
                text_recognition_model_name="PP-OCRv6_small_rec",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                enable_mkldnn=False,
            )
            
            result = ocr.predict(page_img_path)
            texts = []
            for item in result:
                if isinstance(item, dict):
                    rec_texts = item.get("rec_texts", [])
                    texts.extend(rec_texts)
                elif hasattr(item, "rec_texts"):
                    texts.extend(item.rec_texts)
            
            texte = "\n".join(texts).lower()
            
            try:
                os.remove(page_img_path)
            except:
                pass
            
            cps_indicators = [
                "cahier des prescriptions spéciales",
                "cahier des prescriptions spéciales",
                "cps",
                "article",
                "objet",
                "lot",
                "marché",
                "appel d'offres",
                "prescriptions",
                "cahier des charges",
                "règlement",
                "spécifications"
            ]
            
            score = 0
            found_indicators = []
            
            for indicator in cps_indicators:
                if indicator in texte:
                    score += 1
                    found_indicators.append(indicator)
            
            logger.info(f"[CPS-DETECT] Score CPS = {score} (indices trouvés : {found_indicators})")
            
            is_cps = score >= 3
            
            if is_cps:
                logger.info(f"[CPS-DETECT] CPS confirmé → OCR complet")
            else:
                logger.info(f"[CPS-DETECT] Candidat rejeté (score {score} < 3)")
            
            return is_cps, score
            
        except Exception as exc:
            logger.error(f"[CPS-DETECT] Erreur OCR première page : {exc}")
            return False, 0
            
    except Exception as exc:
        logger.error(f"[CPS-DETECT] Erreur vérification candidat : {exc}")
        return False, 0

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
    except Exception as exc:
        # En cas d'exception non gérée, s'assurer que l'état est marqué comme échec
        logger.error(f"[DIAG] Exception non gérée dans le pipeline pour AppelOffres {appel_offres_id}: {exc}")
        existing = db.query(AnalyseDce).filter(AnalyseDce.appel_offres_id == appel_offres_id).first()
        if existing is not None:
            existing.statut = "echec"
            existing.erreur = f"Erreur non gérée: {str(exc)}"
            db.commit()
            db.refresh(existing)
            return existing
        raise
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
    logger.info(f"{'='*50}")
    logger.info(f"{'='*20} AO {appel_offres_id} {'='*20}")
    logger.info(f"{'='*50}")

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
        logger.info(f"[PIPELINE] ZIP ............ RUN (téléchargement nécessaire)")
        download_result = download_dce_for(db, appel_offres_id)
        download_end = time.time()
        logger.info(f"[PIPELINE] ZIP ............ RUN (téléchargement terminé : {download_end - download_start:.2f}s)")
        if not download_result.get("success"):
            return _mark_failed(
                db, analyse,
                f"Téléchargement automatique du DCE échoué : {download_result.get('reason')}",
                nb_documents_analyses=0,
            )
        db.refresh(appel)  # url_cps vient d'être renseigné par download_dce_for
    else:
        download_end = time.time()
        logger.info(f"[PIPELINE] ZIP ............ SKIP (déjà disponible)")

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

    # --- ÉTAPE 1.5 : Détection CPS (Fallback intelligent) ---
    logger.info(f"[CPS-DETECT] Détection CPS avec fallback intelligent")
    
    # Niveau 1 : CPS explicite par nom
    cps_explicite = None
    for extracted_file in extracted_files:
        if extracted_file.extension == "pdf" and _is_cps_file(extracted_file.nom_fichier):
            cps_explicite = extracted_file
            logger.info(f"[CPS-DETECT] CPS explicite trouvé (Niveau 1) : {extracted_file.nom_fichier}")
            break
    
    if cps_explicite:
        # CPS explicite trouvé : marquer pour OCR complet
        cps_explicite._is_cps_confirmed = True
    else:
        # Niveau 2 : Aucun CPS explicite → chercher candidats suspects
        logger.info(f"[CPS-DETECT] Aucun CPS explicite trouvé → recherche candidats suspects (Niveau 2)")
        candidates = _find_cps_candidates(extracted_files)
        
        if candidates:
            logger.info(f"[CPS-DETECT] {len(candidates)} candidat(s) suspect(s) trouvé(s)")
            
            # Niveau 3 : Vérifier les candidats par OCR première page
            for i, candidate in enumerate(candidates):
                logger.info(f"[CPS-DETECT] Vérification candidat {i+1}/{len(candidates)} : {candidate['file'].nom_fichier}")
                
                output_dir = os.path.join(settings.dce_extracted_storage_path, str(appel_offres_id))
                is_cps, score = _verify_cps_candidate(candidate, output_dir)
                
                if is_cps:
                    # CPS confirmé : marquer pour OCR complet
                    candidate['file']._is_cps_confirmed = True
                    logger.info(f"[CPS-DETECT] CPS confirmé (Niveau 3) : {candidate['file'].nom_fichier}")
                    break
                else:
                    logger.info(f"[CPS-DETECT] Candidat rejeté (score {score} < 3)")
            
            # Limite stricte : maximum 3 candidats vérifiés
            if not any(getattr(f, '_is_cps_confirmed', False) for f in extracted_files):
                logger.info(f"[CPS-DETECT] Aucun CPS confirmé après vérification de {len(candidates)} candidats")
        else:
            logger.info(f"[CPS-DETECT] Aucun candidat suspect trouvé")

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
    logger.info(f"[PIPELINE] CONTEXT ........ RUN")
    built_context = context_builder.build_context(db, appel_offres_id, settings.dce_context_max_chars)
    context_end = time.time()
    logger.info(f"[PIPELINE] CONTEXT ........ RUN (terminé : {context_end - context_start:.2f}s)")

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
    logger.info(f"[PIPELINE] LLM ............ RUN")
    result = ai_extractor.call_llm(appel, built_context.texte)
    llm_end = time.time()
    logger.info(f"[PIPELINE] LLM ............ RUN (terminé : {llm_end - llm_start:.2f}s)")

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
    
    # OPTIMISATION : Sauvegarder les hashes pour détection de changement
    analyse.contexte_hash = contexte_hash
    # Calculer le hash du résultat pour détecter si l'analyse a changé
    analyse_json = json.dumps({k: v for k, v in result.items() if k in EXPECTED_FIELDS}, ensure_ascii=False)
    analyse.analyse_hash = hashlib.md5(analyse_json.encode('utf-8')).hexdigest()

    # Évaluation de la complétude de la sortie du LLM (Data Quality Assessment)
    # On compte le nombre de champs attendus qui ont été effectivement remplis.
    filled_fields = sum(1 for field in EXPECTED_FIELDS if result.get(field))
    is_fallback = result.get("resume", "").startswith("Analyse automatique non disponible")
    
    # Évaluation basée sur les champs indispensables (règle métier corrigée)
    indispensable_filled = sum(1 for field in CHAMPS_INDISPENSABLES if result.get(field))
    indispensable_missing = len(CHAMPS_INDISPENSABLES) - indispensable_filled
    
    # DIAGNOSTIC : Audit de la logique métier
    logger.info(f"[DIAG-METIER] === AUDIT LOGIQUE MÉTIER ===")
    logger.info(f"[DIAG-METIER] Règle: statut dépend uniquement des champs indispensables")
    logger.info(f"[DIAG-METIER] Champs indispensables remplis: {indispensable_filled}/{len(CHAMPS_INDISPENSABLES)}")
    logger.info(f"[DIAG-METIER] Champs contextuels vides: {[f for f in EXPECTED_FIELDS if not result.get(f) and f in CHAMPS_CONTEXTUELS]}")
    
    # DIAGNOSTIC : Identification de la cause réelle du statut
    cause_statut = ""
    if is_fallback:
        cause_statut = "LLM échoué (fallback utilisé)"
    elif indispensable_filled == 0:
        cause_statut = "LLM n'a extrait aucune information indispensable"
    elif indispensable_missing > 0:
        cause_statut = f"Champs indispensables manquants ({indispensable_missing})"
    else:
        cause_statut = "Extraction complète"
    
    logger.info(f"[DIAG-STATUT] === DÉTERMINATION STATUT FINAL ===")
    logger.info(f"[DIAG-STATUT] Cause: {cause_statut}")

    if is_fallback:
        # Fallback utilisé (LLM échoué)
        analyse.statut = "partielle"
        analyse.erreur = "L'analyse automatique par IA n'a pas pu être complétée (erreur serveur ou API). Les informations affichées sont basiques. Veuillez consulter manuellement les documents."
    elif indispensable_filled == 0:
        # Hallucination négative ou échec total du modèle à comprendre le contexte
        analyse.statut = "echec"
        analyse.erreur = "Le LLM n'a retourné aucune information exploitable pour ce DCE."
    elif indispensable_missing > 0:
        # Champs indispensables manquants (extraction partielle)
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
    
    # Log de synthèse lisible
    zip_time = download_end - download_start
    unzip_time = unzip_end - unzip_start
    extraction_time = extraction_end - extraction_start
    context_time = context_end - context_start
    llm_time = llm_end - llm_start
    save_time = validation_end - validation_start
    
    logger.info(f"{'='*50}")
    logger.info(f"ZIP ............... {zip_time:.1f} s")
    logger.info(f"UNZIP ............. {unzip_time:.1f} s")
    logger.info(f"INDEX ............. {extraction_time:.1f} s")
    logger.info(f"CONTEXT ........... {context_time:.1f} s")
    logger.info(f"LLM ............... {llm_time:.1f} s")
    logger.info(f"SAVE .............. {save_time:.1f} s")
    logger.info(f"{'='*50}")
    logger.info(f"TOTAL ............. {total_duration:.1f} s")
    logger.info(f"{'='*50}")
    
    return analyse
