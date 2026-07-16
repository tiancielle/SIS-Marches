"""
Orchestrateur de la veille quotidienne :
session -> critères (catégorie Services + dates depuis dernière synchro) ->
parcours de toutes les pages -> dédoublonnage -> pour chaque nouvel avis :
fiche détail + téléchargement DCE + analyse IA (stub) -> persistance.

Conçu pour être appelé aussi bien par l'endpoint HTTP manuel que par le
scheduler (fonction pure, ne dépend pas du cycle de requête FastAPI).
"""
import logging
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

logger = logging.getLogger(__name__)


def _get_or_create_sync_state(db: DbSession) -> SyncState:
    state = db.query(SyncState).filter(SyncState.source == "appel_offres").first()
    if not state:
        state = SyncState(source="appel_offres", derniere_synchro=None)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def run(db: DbSession) -> dict:
    sync_state = _get_or_create_sync_state(db)
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

                    dce_result = download_dce(client, row["ref_consultation"], row["org_acronyme"])
                    if dce_result.get("success"):
                        appel.url_cps = dce_result["url_cps"]
                        db.commit()
                    else:
                        logger.warning(f"DCE non récupéré pour {row['reference']}: {dce_result.get('reason')}")

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

    return {
        "nb_trouves": nb_trouves,
        "nb_nouveaux": nb_nouveaux,
        "nb_doublons": nb_doublons,
        "nb_erreurs": nb_erreurs,
        "references_nouvelles": references_nouvelles,
    }


def download_dce_for(db: DbSession, appel_id: int) -> dict:
    """Téléchargement manuel à la demande — gardé pour compatibilité de l'endpoint existant."""
    appel = db.query(AppelOffres).filter(AppelOffres.id == appel_id).first()
    if not appel:
        return {"success": False, "reason": "Appel d'offres introuvable"}
    if not appel.ref_consultation or not appel.org_acronyme:
        return {"success": False, "reason": "Identifiants portail manquants"}

    client = PortalClient()
    try:
        result = download_dce(client, appel.ref_consultation, appel.org_acronyme)
    finally:
        client.close()

    if result.get("success"):
        appel.url_cps = result["url_cps"]
        db.commit()
    return result