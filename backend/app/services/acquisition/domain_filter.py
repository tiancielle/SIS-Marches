# app/services/acquisition/domain_filter.py 
"""
Filtre les avis par domaine d'activité via mots-clés, en repli du filtre
officiel du portail (le champ idsDomaines n'a pas pu être piloté de manière
fiable sans reproduire toute la popup JS — cf. investigation du 17/07).

Cible les 3 domaines utiles à SIS :
- Études d'ingénierie
- Conseil, audit et assistance à maîtrise d'ouvrage (hors nouvelles technologies)
- Services de technologies de l'information et télécommunications
"""
import re

KEYWORDS = [
    r"\bétude", r"\betude", r"ingénierie", r"ingenierie",
    r"conseil", r"audit", r"assistance.{0,20}maitrise.{0,5}ouvrage", r"\bamo\b",
    r"technolog", r"informatique", r"télécommunication", r"telecommunication",
    r"système.{0,10}information", r"systeme.{0,10}information",
]

EXCLUDE_KEYWORDS = [
    r"nouvelles technologies",  # exclusion explicite demandée pour le domaine Conseil/AMO
]

_KEYWORDS_RE = re.compile("|".join(KEYWORDS), re.IGNORECASE)
_EXCLUDE_RE = re.compile("|".join(EXCLUDE_KEYWORDS), re.IGNORECASE)


def is_relevant(objet: str | None, organisme: str | None = None) -> bool:
    text = " ".join(filter(None, [objet, organisme]))
    if not text:
        return False
    if _EXCLUDE_RE.search(text):
        return False
    return bool(_KEYWORDS_RE.search(text))