"""
Parcourt toutes les pages de résultats jusqu'à la dernière.
Mécanisme confirmé par inspection réelle :
- champ numPageTop contient le numéro de page courant
- passer à la page suivante = incrémenter ce champ + postback sur
  ctl0$CONTENU_PAGE$resultSearch$DefaultButtonTop
- fin de pagination détectée quand les références obtenues sont identiques
  à celles de la page précédente (le serveur republie la dernière page
  valide au-delà de la dernière page réelle, sans erreur explicite)
"""
import time
import logging
from bs4 import BeautifulSoup
from app.core.config import settings
from .normalizer import extract_form_fields

logger = logging.getLogger(__name__)

PAGE_FIELD = "ctl0$CONTENU_PAGE$resultSearch$numPageTop"
POSTBACK_TARGET = "ctl0$CONTENU_PAGE$resultSearch$DefaultButtonTop"


def _extract_refs(form_data: dict) -> set:
    return {v for k, v in form_data.items() if "refCons" in k}


def iter_all_pages(client, search_url: str, first_page_html: str):
    """Générateur qui produit le HTML de chaque page de résultats, dans l'ordre."""
    html = first_page_html
    soup = BeautifulSoup(html, "lxml")
    form_data = extract_form_fields(soup)
    previous_refs = _extract_refs(form_data)

    yield html

    current_page = int(form_data.get(PAGE_FIELD, "1") or "1")

    for _ in range(settings.sync_max_pages - 1):
        next_page = current_page + 1
        form_data[PAGE_FIELD] = str(next_page)
        form_data["PRADO_POSTBACK_TARGET"] = POSTBACK_TARGET
        form_data["PRADO_POSTBACK_PARAMETER"] = ""

        time.sleep(settings.sync_page_delay_seconds)
        resp = client.post(search_url, data=form_data, headers={"Referer": search_url})

        soup = BeautifulSoup(resp.text, "lxml")
        new_form_data = extract_form_fields(soup)
        new_refs = _extract_refs(new_form_data)

        if not new_refs or new_refs == previous_refs:
            logger.info(f"Fin de pagination détectée à la page {current_page}")
            break

        yield resp.text

        previous_refs = new_refs
        form_data = new_form_data
        current_page = int(form_data.get(PAGE_FIELD, next_page) or next_page)