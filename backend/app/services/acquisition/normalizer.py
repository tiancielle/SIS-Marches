import re
from datetime import datetime


def extract_form_fields(soup) -> dict:
    """Extrait tous les champs d'un formulaire PRADO (y compris PRADO_PAGESTATE)."""
    data = {}
    for tag in soup.find_all(["input", "select", "textarea"]):
        name = tag.get("name")
        if not name:
            continue
        ttype = (tag.get("type") or "text").lower()
        if ttype in ("submit", "image", "reset", "button"):
            continue
        if ttype in ("checkbox", "radio"):
            if tag.has_attr("checked"):
                data[name] = tag.get("value", "on")
            continue
        if tag.name == "select":
            selected = tag.find("option", selected=True)
            data[name] = selected.get("value") if selected else ""
            continue
        data[name] = tag.get("value", "")
    return data


def normalize_date(raw: str | None):
    if not raw:
        return None
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", raw)
    if not m:
        return None
    d, mo, y = m.groups()
    try:
        return datetime(int(y), int(mo), int(d)).date()
    except ValueError:
        return None


def normalize_montant(raw: str | None):
    if not raw:
        return None
    cleaned = re.sub(r"[^\d,.]", "", raw).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def normalize_text(raw: str | None):
    if raw is None:
        return None
    return " ".join(raw.split())


def parse_reference(raw_reference_objet: str | None):
    """'25/AOO/AASLM/2026 - ...' -> '25/AOO/AASLM/2026'"""
    if not raw_reference_objet:
        return None
    return raw_reference_objet.split(" - ")[0].strip()


def parse_objet(raw_reference_objet: str | None):
    """Extrait le texte entre 'Objet' et 'Acheteur public' (best-effort, texte souvent dupliqué)."""
    if not raw_reference_objet:
        return None
    m = re.search(r"Objet\s*:?\s*(.*?)(?:Acheteur public|$)", raw_reference_objet, re.DOTALL)
    return normalize_text(m.group(1)) if m else normalize_text(raw_reference_objet)


def parse_acheteur(raw_reference_objet: str | None):
    if not raw_reference_objet:
        return None
    m = re.search(r"Acheteur public\s*:?\s*(.*)$", raw_reference_objet, re.DOTALL)
    return normalize_text(m.group(1)) if m else None


def parse_type_procedure(raw_procedure_categorie: str | None):
    """Best-effort : cherche un des libellés de procédure connus. À enrichir si de nouveaux types apparaissent."""
    if not raw_procedure_categorie:
        return None
    known_types = [
        "Appel d'offres ouvert",
        "Appel d'offres restreint",
        "Concours",
        "Consultation architecturale",
        "Appel à la concurrence",
    ]
    for t in known_types:
        if t.lower() in raw_procedure_categorie.lower():
            return t
    return None


def parse_date_limite(raw_date_limite: str | None):
    """Cherche la première date+heure du type JJ/MM/AAAA HH:MM dans le champ."""
    if not raw_date_limite:
        return None
    m = re.search(r"\d{2}/\d{2}/\d{4}", raw_date_limite)
    return normalize_date(m.group(0)) if m else None