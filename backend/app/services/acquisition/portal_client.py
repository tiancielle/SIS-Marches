"""
Client HTTP stateful pour l'acquisition des données du portail.
Justification : Une acquisition fiable est le prérequis absolu de toute chaîne 
d'extraction (OCR/NLP). Un fichier téléchargé de manière incomplète ou corrompue 
rendrait toute tentative d'extraction bilingue ultérieure vaine.
"""
import time
import requests
from app.core.config import settings

# ÉMULATION DE NAVIGATEUR : Les portails publics utilisent souvent des WAF 
# (Web Application Firewalls) qui bloquent les requêtes de scripts Python 
# par défaut. Ces en-têtes permettent de passer pour un navigateur légitime, 
# garantissant l'accès aux fichiers DCE nécessaires à l'analyse.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,"
        "image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    ),
    "Accept-Language": "fr,fr-FR;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Upgrade-Insecure-Requests": "1",
}


class PortalClient:
    """
    Encapsule une session HTTP unique pour tout le parcours
    (formulaire -> recherche -> liste -> fiche -> téléchargement DCE).
    Une instance = un run d'acquisition. Fermer explicitement via close().
    
    ARCHITECTURE : Le maintien d'une session unique (requests.Session) est crucial 
    pour conserver les cookies de session et les jetons CSRF entre les différentes 
    étapes du parcours, imitant le comportement d'un utilisateur réel.
    """

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(BROWSER_HEADERS)
        self.timeout = settings.portal_timeout_seconds

    def _request_with_retry(self, method, url, max_retries=3, **kwargs):
        """
        Mécanisme de résilience réseau (Exponential Backoff).
        Les portails publics peuvent être instables ou limiter le débit. 
        Plutôt que d'échouer immédiatement et de perdre un document potentiel 
        pour l'analyse OCR, on tente de nouveau avec un délai croissant.
        """
        last_exc = None
        for attempt in range(max_retries):
            try:
                return getattr(self.session, method)(url, timeout=self.timeout, **kwargs)
            except (
                requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.ChunkedEncodingError,
            ) as exc:
                last_exc = exc
                time.sleep(1.5 * (attempt + 1))  # backoff progressif
        raise last_exc

    def get(self, url, headers=None, allow_redirects=True):
        return self._request_with_retry("get", url, headers=headers, allow_redirects=allow_redirects)

    def post(self, url, data=None, headers=None, allow_redirects=True):
        return self._request_with_retry("post", url, data=data, headers=headers, allow_redirects=allow_redirects)

    def close(self):
        self.session.close()