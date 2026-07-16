"""
Point d'accroche pour l'analyse IA, appelé par sync_orchestrator après
chaque nouvel AppelOffres enregistré. AUCUNE IMPLÉMENTATION RÉELLE ICI :
le service IA n'existe pas encore côté backend (hors périmètre de cette
session — séparation stricte acquisition/analyse, cf. cahier des charges
section 5.8).

No-op qui journalise, pour que sync_orchestrator ait déjà le bon point
d'intégration le jour où le vrai service IA sera branché.
"""
import logging

logger = logging.getLogger(__name__)


def analyser_appel_offres(appel_offres_id: int) -> bool:
    logger.info(f"[IA] Analyse demandée pour AppelOffres id={appel_offres_id} — service IA non implémenté, ignoré.")
    return False