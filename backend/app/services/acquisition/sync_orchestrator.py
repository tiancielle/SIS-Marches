"""
Orchestrateur de la veille quotidienne :
session -> critères (catégorie Services + dates depuis dernière synchro) ->
parcours de toutes les pages -> dédoublonnage -> pour chaque nouvel avis :
fiche détail + analyse IA niveau 1 (stub) -> persistance des métadonnées.

Lazy loading : cette fonction NE télécharge PAS les DCE. Elle ne persiste que
les métadonnées de chaque avis (url_cps reste None). Le téléchargement du DCE
et son traitement (niveau 2) restent des opérations séparées, déclenchés à la
demande via POST /{id}/telecharger-dce et POST /{id}/traiter-dce
(voir download_dce_for ci-dessous, et app.services.dce_processing.dce_pipeline).

Conçu pour être appelé aussi bien par l'endpoint HTTP manuel que par le
scheduler (fonction pure, ne dépend pas du cycle de requête FastAPI).

Justification architecturale : Ce module implémente la première étape d'un pipeline 
ETL (Extract, Transform, Load) orienté "Metadata-First". En séparant l'ingestion 
légère des métadonnées (rapide, faible bande passante) du traitement lourd des 
documents (OCR, LLM), on optimise les ressources et on permet une réactivité 
immédiate de l'interface utilisateur, tout en garantissant la traçabilité des 
opérations via une machine à états robuste.
"""
import logging
import os
import threading
from datetime import datetime
from sqlalchemy.orm import Session as DbSession

from app.models.appel_offres import AppelOffres
from app.models.sync_state import SyncState
from app.core.config import settings
from .portal_client import PortalClient
from .list_fetcher import fetch_search_form, submit_search
from .list_parser import parse_list_page
from .search_criteria import build_search_criteria
from .pagination import iter_all_pages
from .detail_navigator import open_detail, build_detail_url
from .dce_downloader import download_dce
from .ai_analysis_stub import analyser_appel_offres
from .normalizer import extract_form_fields
from .domain_filter import is_relevant

logger = logging.getLogger(__name__)

# CONTRÔLE DE CONCURRENCE (Niveau 1 : Global) :
# Verrou en mémoire protégeant l'ensemble du processus de synchronisation.
# Il empêche le lancement de deux jobs de scraping en parallèle, ce qui pourrait 
# surcharger le portail cible (risque de ban IP) et corrompre l'état de pagination.
_sync_lock = threading.Lock()

# CONTRÔLE DE CONCURRENCE (Niveau 2 : Par ressource) :
# Dictionnaire de verrous pour le téléchargement des DCE. Distinct du verrou global, 
# il permet à la synchronisation de tourner tout en bloquant les tentatives de 
# téléchargement simultané d'un même fichier (ex: double-clic utilisateur).
_dce_locks: dict[int, threading.Lock] = {}
_dce_locks_guard = threading.Lock()


def _get_dce_lock(appel_id: int) -> threading.Lock:
    """Fabrique thread-safe pour récupérer ou créer un verrou spécifique à un appel d'offres."""
    with _dce_locks_guard:
        if appel_id not in _dce_locks:
            _dce_locks[appel_id] = threading.Lock()
        return _dce_locks[appel_id]


def _get_or_create_sync_state(db: DbSession) -> SyncState:
    """
    Pattern "Upsert" (Update or Insert) pour l'état de synchronisation.
    Garantit l'existence d'un point de référence unique pour les synchronisations 
    incrémentales, permettant de ne requêter que les nouveaux avis depuis la 
    dernière exécution réussie (optimisation de la charge réseau et de la base de données).
    """
    state = db.query(SyncState).filter(SyncState.source == "appel_offres").first()
    if not state:
        state = SyncState(source="appel_offres", derniere_synchro=None)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def run(db: DbSession) -> dict:
    """
    Point d'entrée public avec garde de concurrence non-bloquante.
    CHOIX UX : `blocking=False` permet de répondre immédiatement au client (HTTP 200 
    avec un message informatif) si un job est déjà en cours, évitant ainsi de bloquer 
    un thread du serveur web (FastAPI) sur une opération de longue durée.
    """
    if not _sync_lock.acquire(blocking=False):
        return {
            "nb_trouves": 0,
            "nb_nouveaux": 0,
            "nb_doublons": 0,
            "nb_erreurs": 0,
            "references_nouvelles": [],
            "message": "Une synchronisation est déjà en cours, ignorée.",
        }

    try:
        return _run_locked(db)
    finally:
        _sync_lock.release()


def _run_locked(db: DbSession) -> dict:
    sync_state = _get_or_create_sync_state(db)

    # DÉTECTION D'ÉTAT "ZOMBIE" (Crash Recovery) :
    # Le verrou en mémoire a déjà empêché la concurrence réelle. Ce flag en base 
    # sert uniquement de système d'alerte : s'il est encore à True, cela signifie 
    # que le processus a été brutalement interrompu (crash, OOM kill) lors d'un 
    # run précédent. On le signale dans les logs pour le monitoring, mais on 
    # poursuit normalement car le lock mémoire est neuf.
    if sync_state.en_cours:
        age_minutes = (datetime.now() - sync_state.updated_at.replace(tzinfo=None)).total_seconds() / 60 \
            if sync_state.updated_at else None
        logger.warning(
            f"SyncState.en_cours était déjà à True (âge : "
            f"{f'{age_minutes:.0f} min' if age_minutes is not None else 'inconnu'}) — "
            f"probablement un process interrompu lors d'un run précédent. Sans incidence "
            f"ici grâce au verrou en mémoire, on repart normalement."
        )

    # Marquer comme en cours pour les futurs contrôles de cohérence
    sync_state.en_cours = True
    db.commit()

    client = PortalClient()
    nb_trouves = nb_nouveaux = nb_doublons = nb_erreurs = 0
    references_nouvelles: list[str] = []

    try:
        search_url = f"{settings.portal_base_url}{settings.portal_search_path}"

        # INGENIERIE DE SCRAPING RÉSILIENTE : 
        # On récupère dynamiquement les champs du formulaire plutôt que de les coder en dur.
        # Cela permet de capturer automatiquement les jetons anti-CSRF ou les champs cachés 
        # spécifiques au framework du portail (ex: PRADO postback), rendant le scraper 
        # robuste face aux mises à jour mineures de l'interface.
        soup_form = fetch_search_form(client)
        form_data = extract_form_fields(soup_form)
        form_data = build_search_criteria(form_data, sync_state.derniere_synchro)
        form_data["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$AdvancedSearch$lancerRecherche"
        form_data["PRADO_POSTBACK_PARAMETER"] = ""

        resp_first_page = client.post(search_url, data=form_data, headers={"Referer": search_url})
        
        # OPTIMISATION DE REQUÊTE (Set-based Deduplication) :
        # On charge toutes les références existantes en mémoire dans un `set` Python.
        # Cela garantit une complexité de recherche O(1) pour chaque ligne, évitant 
        # le problème classique des requêtes N+1 qui ralentirait exponentiellement la boucle.
        existing_refs = {r[0] for r in db.query(AppelOffres.reference).all()}

        for page_html in iter_all_pages(client, search_url, resp_first_page.text):
            raw_rows = parse_list_page(page_html)
            nb_trouves += len(raw_rows)

            for row in raw_rows:
                if row["reference"] in existing_refs:
                    nb_doublons += 1
                    continue

                # FILTRAGE PRÉCOCE (Fail-Fast) :
                # On évalue la pertinence du domaine métier sur le titre (objet) avant 
                # toute navigation coûteuse vers la page de détail. Cela économise 
                # considérablement la bande passante et le temps de traitement.
                if not is_relevant(row["objet"]):
                    continue

                try:
                    # Navigation vers la fiche détail pour s'assurer que l'avis est valide 
                    # et que la référence est bien active sur le portail.
                    open_detail(client, row["ref_consultation"], row["org_acronyme"], referer=search_url)

                    appel = AppelOffres(
                        reference=row["reference"],
                        objet=row["objet"],
                        organisme=row["organisme"],
                        type_procedure=row["type_procedure"],
                        date_limite_remise=row["date_limite_remise"],
                        ref_consultation=row["ref_consultation"],
                        org_acronyme=row["org_acronyme"],
                        url_avis=build_detail_url(row["ref_consultation"], row["org_acronyme"]),
                        statut="nouveau",
                    )
                    db.add(appel)
                    
                    # TOLÉRANCE AUX PANNES AU NIVEAU DE LA LIGNE (Row-Level Fault Tolerance) :
                    # On commit immédiatement chaque nouvel avis. Si une fiche détail 
                    # suivante est corrompue ou provoque une exception, ce `db.rollback()` 
                    # local n'annulera pas les insertions précédentes. Le pipeline sacrifie 
                    # un peu de performance de base de données pour garantir la résilience 
                    # et la progression maximale du traitement par lots.
                    db.commit()
                    db.refresh(appel)

                    # LAZY LOADING : Le DCE n'est pas téléchargé ici. On déclenche 
                    # éventuellement une analyse IA légère (stub) sur les métadonnées, 
                    # mais le téléchargement lourd reste une action explicite et séparée.
                    analyser_appel_offres(appel.id)

                    nb_nouveaux += 1
                    references_nouvelles.append(row["reference"])
                    existing_refs.add(row["reference"])

                except Exception as exc:
                    # On loggue l'erreur complète pour le débogage, on incrémente le compteur, 
                    # et on annule uniquement la transaction en cours pour cet avis spécifique.
                    logger.exception(f"Erreur traitement avis {row.get('reference')}: {exc}")
                    nb_erreurs += 1
                    db.rollback()

        # Mise à jour du point de repère temporel pour la prochaine synchronisation incrémentale
        sync_state.derniere_synchro = datetime.now()
        db.commit()

    finally:
        client.close()
        # Libération systématique du verrou et nettoyage de l'état, même en cas d'exception non gérée.
        sync_state.en_cours = False
        db.commit()

    resultat = {
        "nb_trouves": nb_trouves,
        "nb_nouveaux": nb_nouveaux,
        "nb_doublons": nb_doublons,
        "nb_erreurs": nb_erreurs,
        "references_nouvelles": references_nouvelles,
    }
    # OBSERVABILITÉ : Cette fonction étant souvent exécutée en tâche de fond (scheduler), 
    # le retour de dictionnaire n'est pas toujours consulté. Le log est donc le seul 
    # moyen fiable d'auditer le volume et la santé des synchronisations automatiques.
    logger.info(f"Synchronisation terminée : {resultat}")
    return resultat


def download_dce_for(db: DbSession, appel_id: int) -> dict:
    """
    Téléchargement à la demande, avec cache réel et protection anti-double-clic.

    Cache : on ne considère le DCE comme déjà disponible que si `url_cps` est
    renseigné ET que le fichier existe réellement sur disque (si l'utilisateur
    supprime le zip manuellement, on retélécharge plutôt que de renvoyer un
    chemin mort).

    Concurrence : un verrou par appel_offres_id empêche un double-clic (ou un
    retry frontend pendant que la première requête tourne encore) de déclencher
    deux téléchargements en parallèle contre le portail. Le verrou protège même
    si le frontend a un bug — le backend refuse explicitement en 409-like
    (via le champ `in_progress`) plutôt que de dupliquer le travail.
    """
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        return {"success": False, "reason": "Appel d'offres introuvable"}

    # VALIDATION DE COHÉRENCE DU CACHE (Filesystem Drift Protection) :
    # On ne se fie pas uniquement à la base de données. Si le fichier a été 
    # supprimé manuellement du disque, la condition `os.path.exists` échoue 
    # et force un nouveau téléchargement, évitant ainsi de renvoyer un chemin 
    # invalide ("chemin mort") au frontend.
    if appel.url_cps and os.path.exists(appel.url_cps):
        return {"success": True, "url_cps": appel.url_cps, "cached": True}

    if not appel.ref_consultation or not appel.org_acronyme:
        return {"success": False, "reason": "Identifiants portail manquants"}

    # Acquisition du verrou spécifique à cette ressource (non-bloquant)
    lock = _get_dce_lock(appel_id)
    if not lock.acquire(blocking=False):
        return {
            "success": False,
            "reason": "DCE déjà en cours de téléchargement pour cet appel d'offres.",
            "in_progress": True,
        }

    try:
        # MACHINE À ÉTATS (State Machine) :
        # On met à jour le statut immédiatement pour informer tout autre processus 
        # ou utilisateur qui interrogerait l'API pendant le téléchargement.
        appel.dce_statut = "TELECHARGEMENT"
        appel.dce_erreur = None
        db.commit()

        client = PortalClient()
        try:
            result = download_dce(client, appel.ref_consultation, appel.org_acronyme)
        finally:
            # Garantie de libération des ressources réseau, même en cas d'exception 
            # lors de l'appel à download_dce.
            client.close()

        # Transition d'état finale basée sur le résultat de l'opération
        if result.get("success"):
            appel.url_cps = result["url_cps"]
            appel.dce_statut = "TELECHARGE"
            appel.dce_erreur = None
        else:
            appel.dce_statut = "ERREUR"
            appel.dce_erreur = result.get("reason")
        db.commit()
        return result

    except Exception as exc:
        # Filet de sécurité ultime : toute exception non prévue (ex: problème DB) 
        # est capturée pour marquer l'échec de manière propre et auditable.
        appel.dce_statut = "ERREUR"
        appel.dce_erreur = str(exc)
        db.commit()
        raise

    finally:
        # Libération systématique du verrou pour permettre de futures tentatives.
        lock.release()