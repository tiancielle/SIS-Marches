"""
Orchestrateur de la veille quotidienne :
session -> critères (catégorie Services + dates depuis dernière synchro) ->
parcours de toutes les pages -> dédoublonnage -> pour chaque nouvel avis :
fiche détail + analyse IA niveau 1 (stub) -> persistance des métadonnées.

Lazy loading : cette fonction NE télécharge PAS les DCE. Elle ne persiste que
les métadonnées de chaque avis (url_cps reste None). Le téléchargement du DCE
et son traitement (niveau 2) restent des opérations séparées, déclenchées à la
demande via POST /{id}/telecharger-dce et POST /{id}/traiter-dce
(voir download_dce_for ci-dessous, et app.services.dce_processing.dce_pipeline).

Conçu pour être appelé aussi bien par l'endpoint HTTP manuel que par le
scheduler (fonction pure, ne dépend pas du cycle de requête FastAPI).
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
from .detail_navigator import open_detail
from .dce_downloader import download_dce
from .ai_analysis_stub import analyser_appel_offres
from .normalizer import extract_form_fields
from .domain_filter import is_relevant

logger = logging.getLogger(__name__)

# Verrou en mémoire — la vraie protection contre l'exécution concurrente au sein d'un
# même process. Le flag `SyncState.en_cours` en base reste utile pour détecter un crash
# après un redémarrage du serveur (le lock en mémoire, lui, est remis à zéro au restart),
# mais seul ce Lock empêche deux requêtes quasi simultanées (double-clic, retry frontend)
# de scraper en parallèle et de se marcher dessus sur les mêmes références.
_sync_lock = threading.Lock()

# Un verrou par appel_offres_id pour le téléchargement DCE à la demande — distinct
# du verrou de sync ci-dessus. Protège contre un double-clic ou un retry frontend
# qui déclencherait deux téléchargements concurrents pour le même AO.
_dce_locks: dict[int, threading.Lock] = {}
_dce_locks_guard = threading.Lock()


def _get_dce_lock(appel_id: int) -> threading.Lock:
    with _dce_locks_guard:
        if appel_id not in _dce_locks:
            _dce_locks[appel_id] = threading.Lock()
        return _dce_locks[appel_id]


def _get_or_create_sync_state(db: DbSession) -> SyncState:
    state = db.query(SyncState).filter(SyncState.source == "appel_offres").first()
    if not state:
        state = SyncState(source="appel_offres", derniere_synchro=None)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def run(db: DbSession) -> dict:
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

    # Le Lock ci-dessus a déjà réglé la concurrence réelle. Ce flag en base ne sert
    # plus qu'à signaler un crash précédent (utile pour un futur diagnostic/monitoring),
    # jamais à bloquer — on l'écrase toujours ici sans condition.
    if sync_state.en_cours:
        age_minutes = (datetime.now() - sync_state.updated_at.replace(tzinfo=None)).total_seconds() / 60 \
            if sync_state.updated_at else None
        logger.warning(
            f"SyncState.en_cours était déjà à True (âge : "
            f"{f'{age_minutes:.0f} min' if age_minutes is not None else 'inconnu'}) — "
            f"probablement un process interrompu lors d'un run précédent. Sans incidence "
            f"ici grâce au verrou en mémoire, on repart normalement."
        )

    # Marquer comme en cours
    sync_state.en_cours = True
    db.commit()

    client = PortalClient()
    nb_trouves = nb_nouveaux = nb_doublons = nb_erreurs = 0
    references_nouvelles: list[str] = []

    try:
        search_url = f"{settings.portal_base_url}{settings.portal_search_path}"

        soup_form = fetch_search_form(client)
        form_data = extract_form_fields(soup_form)
        form_data = build_search_criteria(form_data, sync_state.derniere_synchro)
        form_data["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$AdvancedSearch$lancerRecherche"
        form_data["PRADO_POSTBACK_PARAMETER"] = ""

        resp_first_page = client.post(search_url, data=form_data, headers={"Referer": search_url})
        existing_refs = {r[0] for r in db.query(AppelOffres.reference).all()}

        for page_html in iter_all_pages(client, search_url, resp_first_page.text):
            raw_rows = parse_list_page(page_html)
            nb_trouves += len(raw_rows)

            for row in raw_rows:
                if row["reference"] in existing_refs:
                    nb_doublons += 1
                    continue

                # Filtre de domaine (objet uniquement — jamais l'organisme, cf. domain_filter.py)
                if not is_relevant(row["objet"]):
                    continue

                try:
                    open_detail(client, row["ref_consultation"], row["org_acronyme"], referer=search_url)

                    appel = AppelOffres(
                        reference=row["reference"],
                        objet=row["objet"],
                        organisme=row["organisme"],
                        type_procedure=row["type_procedure"],
                        date_limite_remise=row["date_limite_remise"],
                        ref_consultation=row["ref_consultation"],
                        org_acronyme=row["org_acronyme"],
                        statut="nouveau",
                    )
                    db.add(appel)
                    db.commit()
                    db.refresh(appel)

                    # Lazy loading : le DCE n'est plus téléchargé ici. La synchro ne
                    # persiste que les métadonnées (appel.url_cps reste None) ; le
                    # téléchargement se fait à la demande via POST /{id}/telecharger-dce,
                    # déclenché par le frontend à l'ouverture de l'avis ou via /traiter-dce.
                    analyser_appel_offres(appel.id)

                    nb_nouveaux += 1
                    references_nouvelles.append(row["reference"])
                    existing_refs.add(row["reference"])

                except Exception as exc:
                    logger.exception(f"Erreur traitement avis {row.get('reference')}: {exc}")
                    nb_erreurs += 1
                    db.rollback()

        sync_state.derniere_synchro = datetime.now()
        db.commit()

    finally:
        client.close()
        # Libérer le verrou de synchronisation
        sync_state.en_cours = False
        db.commit()

    resultat = {
        "nb_trouves": nb_trouves,
        "nb_nouveaux": nb_nouveaux,
        "nb_doublons": nb_doublons,
        "nb_erreurs": nb_erreurs,
        "references_nouvelles": references_nouvelles,
    }
    # Essentiel : /synchroniser tourne en tâche de fond, ce résumé ne sera jamais lu
    # nulle part ailleurs — sans ce log, ces chiffres sont perdus pour de bon.
    logger.info(f"Synchronisation terminée : {resultat}")
    return resultat


def download_dce_for(db: DbSession, appel_id: int) -> dict:
    """Téléchargement à la demande, avec cache réel et protection anti-double-clic.

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

    if appel.url_cps and os.path.exists(appel.url_cps):
        return {"success": True, "url_cps": appel.url_cps, "cached": True}

    if not appel.ref_consultation or not appel.org_acronyme:
        return {"success": False, "reason": "Identifiants portail manquants"}

    lock = _get_dce_lock(appel_id)
    if not lock.acquire(blocking=False):
        return {
            "success": False,
            "reason": "DCE déjà en cours de téléchargement pour cet appel d'offres.",
            "in_progress": True,
        }

    try:
        appel.dce_statut = "TELECHARGEMENT"
        appel.dce_erreur = None
        db.commit()

        client = PortalClient()
        try:
            result = download_dce(client, appel.ref_consultation, appel.org_acronyme)
        finally:
            client.close()

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
        appel.dce_statut = "ERREUR"
        appel.dce_erreur = str(exc)
        db.commit()
        raise

    finally:
        lock.release()