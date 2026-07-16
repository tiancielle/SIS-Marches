"""
Étape 1 : GET le formulaire de recherche, POST la recherche (postback confirmé
par capture HAR : PRADO_POSTBACK_TARGET = ...AdvancedSearch$lancerRecherche).
"""
from bs4 import BeautifulSoup
from app.core.config import settings
from .normalizer import extract_form_fields

SEARCH_URL = f"{settings.portal_base_url}{settings.portal_search_path}"


def fetch_search_form(client):
    resp = client.get(SEARCH_URL)
    return BeautifulSoup(resp.text, "lxml")


def submit_search(client, soup_form) -> str:
    form_data = extract_form_fields(soup_form)
    form_data["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$AdvancedSearch$lancerRecherche"
    form_data["PRADO_POSTBACK_PARAMETER"] = ""

    resp = client.post(SEARCH_URL, data=form_data, headers={"Referer": SEARCH_URL})
    return resp.text