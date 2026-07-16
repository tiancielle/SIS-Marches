"""
Parsing de la fiche détail. La plupart des métadonnées utiles sont déjà
disponibles depuis la page de liste (list_parser.py). Ce module ne fait
qu'un contrôle de cohérence pour l'instant ; à enrichir si des champs
supplémentaires (ex. lien avis complémentaire) sont nécessaires plus tard.
"""
from bs4 import BeautifulSoup


def parse_detail_page(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    titre = soup.title.get_text(strip=True) if soup.title else None
    return {
        "titre_page": titre,
        "page_valide": titre == "Marchés publics électroniques",
    }