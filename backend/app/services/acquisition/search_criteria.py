"""
Construit les critères de recherche à injecter dans le formulaire PRADO :
- filtre catégorie = Services (valeur "3", confirmée par inspection du <select>)
- plage de dates (depuis la dernière synchro, ou fallback si première exécution)
"""
from datetime import datetime, timedelta
from app.core.config import settings


def build_search_criteria(form_data: dict, derniere_synchro: datetime | None) -> dict:
    data = dict(form_data)

    data["ctl0$CONTENU_PAGE$AdvancedSearch$categorie"] = settings.sync_categorie_filter

    today = datetime.now()
    date_start = derniere_synchro or (today - timedelta(days=settings.sync_fallback_days))

    data["ctl0$CONTENU_PAGE$AdvancedSearch$dateMiseEnLigneCalculeStart"] = date_start.strftime("%d/%m/%Y")
    data["ctl0$CONTENU_PAGE$AdvancedSearch$dateMiseEnLigneCalculeEnd"] = today.strftime("%d/%m/%Y")

    return data