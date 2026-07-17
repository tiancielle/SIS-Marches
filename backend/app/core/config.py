import os
from pydantic_settings import BaseSettings

# Calcul du chemin absolu vers le dossier racine du backend (app/core/config.py -> dirname x3 = backend/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{os.path.join(BASE_DIR, 'sis.db')}"
    jwt_secret_key: str = "change-me"
    jwt_expiration_minutes: int = 60
    cors_origins: list[str] = ["http://localhost:5173"]

    # Portail des marchés publics
    portal_base_url: str = "https://www.marchespublics.gov.ma"
    portal_search_path: str = "/index.php?page=entreprise.EntrepriseAdvancedSearch&searchAnnCons"
    portal_timeout_seconds: int = 20
    sync_max_auto_analyse: int = 20  # plafond d'analyse IA auto par synchro (règle métier 4.2)

    # Formulaire d'identité pour le retrait du DCE (valeurs non vérifiées par le portail)
    portal_demande_nom: str = "a"
    portal_demande_prenom: str = "a"
    portal_demande_email: str = "a@gmail.com"

    # Stockage local des DCE téléchargés
    dce_storage_path: str = "./uploads/dce"

    # Filtre catégorie — confirmé : "3" = Services
    sync_categorie_filter: str = "3"

    # Fenêtre de repli si aucune synchro précédente n'existe (première exécution)
    sync_fallback_days: int = 7

    # Délai de politesse entre requêtes de pagination (secondes)
    sync_page_delay_seconds: float = 1.5

    # Sécurité : nombre max de pages parcourues par run
    sync_max_pages: int = 50

    # Scheduler
    scheduler_enabled: bool = True
    scheduler_hour: int = 6
    scheduler_minute: int = 0

    class Config:
        env_file = ".env"

settings = Settings()