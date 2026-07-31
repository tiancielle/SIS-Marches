"""
list_parser.py : Transformation du HTML brut en enregistrements structurés.
Justification : Ce module fait le lien entre le scraping visuel et les données 
structurées. L'extraction précise de `ref_consultation` et `org_acronyme` est 
vitale, car ce sont les clés primaires qui permettront ensuite de construire 
l'URL de téléchargement du DCE pour l'analyse OCR.
"""
import re
from bs4 import BeautifulSoup
from .normalizer import parse_reference, parse_objet, parse_acheteur, parse_type_procedure, parse_date_limite


def parse_list_page(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    table = soup.find("table", class_="table-results")
    if not table:
        return []

    results = []
    for row in table.find_all("tr"):
        tds = row.find_all("td")
        if len(tds) < 7:
            continue  # ligne d'en-tête, pas une ligne de données

        # Extraction des identifiants uniques depuis le lien hypertexte
        detail_link = row.find("a", href=re.compile(r"page=entreprise\.EntrepriseDetailConsultation"))
        ref_consultation = org_acronyme = None
        if detail_link:
            m = re.search(r"refConsultation=(\w+)", detail_link["href"])
            o = re.search(r"orgAcronyme=(\w+)", detail_link["href"])
            ref_consultation = m.group(1) if m else None
            org_acronyme = o.group(1) if o else None

        raw_procedure_categorie = tds[1].get_text(" ", strip=True)
        raw_reference_objet = tds[2].get_text(" ", strip=True)
        raw_date_limite = tds[4].get_text(" ", strip=True)

        reference = parse_reference(raw_reference_objet)
        # FILTRAGE PRÉCOCE : Si la référence ou l'ID de consultation est manquant, 
        # on ne peut pas télécharger le DCE plus tard. On ignore donc cette ligne 
        # pour maintenir l'intégrité du dataset.
        if not reference or not ref_consultation:
            continue

        results.append({
            "reference": reference,
            "objet": parse_objet(raw_reference_objet),
            "organisme": parse_acheteur(raw_reference_objet),
            "type_procedure": parse_type_procedure(raw_procedure_categorie),
            "date_limite_remise": parse_date_limite(raw_date_limite),
            "ref_consultation": ref_consultation,
            "org_acronyme": org_acronyme,
        })
    return results