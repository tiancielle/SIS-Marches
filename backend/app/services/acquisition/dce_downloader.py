"""
Parcours complet de retrait du DCE : fiche -> formulaire d'identité ->
déclenchement -> téléchargement du zip. Confirmé par capture HAR.

LIMITE CONNUE : ne gère pas encore les consultations multi-lots
(widget de sélection de lot type VirtualSelect). Pour ces cas, le
téléchargement échouera probablement silencieusement (page renvoyée
inchangée) -- à traiter séparément si besoin.

Justification architecturale : Ce module implémente une stratégie de "Stateful Web Scraping" 
(scrapping avec maintien d'état). Plutôt que de tenter un téléchargement direct (souvent 
bloqué par les WAF), il reproduit fidèlement le parcours utilisateur réel en plusieurs étapes, 
en conservant les jetons d'état (CSRF, PRADO) et en émulant les en-têtes d'un navigateur 
légitime pour maximiser le taux de succès des requêtes.
"""
import os
from bs4 import BeautifulSoup
from app.core.config import settings
from .normalizer import extract_form_fields
from .detail_navigator import build_detail_url

# Gabarit d'URL pour la page de demande de téléchargement.
# La construction dynamique permet de cibler précisément la consultation 
# via ses identifiants uniques (référence et acronyme de l'organisme).
DOWNLOAD_URL_TEMPLATE = (
    f"{settings.portal_base_url}/index.php?page=entreprise.EntrepriseDemandeTelechargementDce"
    "&refConsultation={ref_consultation}&orgAcronyme={org_acronyme}"
)


def download_dce(client, ref_consultation: str, org_acronyme: str) -> dict:
    """
    Exécute le flux complet de téléchargement du DCE.
    Retourne un dictionnaire de statut pour permettre une gestion d'erreur 
    gracieuse (graceful degradation) par l'orchestrateur appelant.
    """
    detail_url = build_detail_url(ref_consultation, org_acronyme)
    telechargement_url = DOWNLOAD_URL_TEMPLATE.format(
        ref_consultation=ref_consultation, org_acronyme=org_acronyme
    )

    # ÉTAPE 1 : Récupération du formulaire dynamique.
    # On effectue une requête GET initiale pour obtenir les champs cachés 
    # (jetons anti-CSRF, état de la session PRADO) générés par le serveur.
    resp2 = client.get(telechargement_url, headers={"Referer": detail_url})
    soup_dl = BeautifulSoup(resp2.text, "lxml")
    
    # ROBUSTESSE : extract_form_fields capture tous les champs, y compris les 
    # champs cachés dynamiques. Coder ces valeurs en dur rendrait le scraper 
    # fragile face aux mises à jour mineures du portail.
    form_data = extract_form_fields(soup_dl)

    # ÉTAPE 2 : Préparation des données de soumission (Simulation d'identité).
    # On injecte les cibles de postback spécifiques au framework PRADO du portail, 
    # ainsi que les données d'identité requises par la logique métier du site 
    # pour autoriser le téléchargement.
    form_data["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$validateButton"
    form_data["PRADO_POSTBACK_PARAMETER"] = ""
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$RadioGroup"] = (
        "ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$choixTelechargement"
    )
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$accepterConditions"] = "on"
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$nom"] = settings.portal_demande_nom
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$prenom"] = settings.portal_demande_prenom
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$email"] = settings.portal_demande_email
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$etablissementEntreprise"] = (
        "ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$france"
    )
    form_data["ctl0$CONTENU_PAGE$EntrepriseFormulaireDemande$pays"] = "0"

    # ÉTAPE 3 : Soumission du formulaire d'identité.
    # Le Referer est maintenu pour satisfaire les vérifications basiques de sécurité du serveur.
    resp3 = client.post(telechargement_url, data=form_data, headers={"Referer": telechargement_url})
    soup_final = BeautifulSoup(resp3.text, "lxml")
    
    # On ré-extrait les champs du formulaire mis à jour après la première soumission, 
    # car le framework a probablement régénéré des jetons de session ou d'état.
    form_data_final = extract_form_fields(soup_final)

    # ÉTAPE 4 : Déclenchement effectif du téléchargement.
    form_data_final["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$EntrepriseDownloadDce$completeDownload"
    form_data_final["PRADO_POSTBACK_PARAMETER"] = ""

    # SÉCURITÉ : allow_redirects=False nous permet d'intercepter la réponse HTTP 
    # avant que la bibliothèque ne suive automatiquement la redirection. Cela permet 
    # de valider la cible (Location) et d'éviter les redirections ouvertes ou les boucles.
    resp4 = client.post(
        telechargement_url, data=form_data_final,
        headers={"Referer": telechargement_url}, allow_redirects=False,
    )

    # Vérification que le serveur a bien répondu par une redirection HTTP valide (301/302).
    if resp4.status_code not in (301, 302) or not resp4.headers.get("Location"):
        return {"success": False, "reason": f"Pas de redirection (status {resp4.status_code})"}

    # Reconstruction de l'URL finale de téléchargement à partir de l'en-tête Location.
    final_url = settings.portal_base_url + "/" + resp4.headers["Location"].lstrip("/")
    
    # ÉTAPE 5 : Téléchargement final avec émulation de navigateur.
    # Les en-têtes "Sec-Fetch-*" sont cruciaux : de nombreux WAF (Web Application Firewalls) 
    # bloquent les requêtes de téléchargement direct si elles ne proviennent pas d'une 
    # navigation utilisateur légitime (mode "navigate", site "same-origin").
    resp5 = client.get(
        final_url,
        headers={
            "Referer": telechargement_url,
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        },
    )

    # CONTRÔLE D'INTÉGRITÉ DES DONNÉES (Data Validation) :
    # On vérifie le Content-Type avant d'écrire le fichier. Sans cette vérification, 
    # on risquerait d'enregistrer une page d'erreur HTML (ex: 403 Forbidden ou 500) 
    # avec une extension .zip, ce qui corromprait silencieusement le pipeline en aval.
    if "zip" not in resp5.headers.get("Content-Type", ""):
        return {"success": False, "reason": "Réponse inattendue (pas un zip)", "status": resp5.status_code}

    # ÉTAPE 6 : Persistance sur le système de fichiers.
    os.makedirs(settings.dce_storage_path, exist_ok=True)
    filename = f"dce_{ref_consultation}_{org_acronyme}.zip"
    filepath = os.path.join(settings.dce_storage_path, filename)
    
    with open(filepath, "wb") as f:
        f.write(resp5.content)

    # Retour d'un chemin normalisé (slashes avant) pour garantir la compatibilité 
    # des chemins entre Windows (où le script peut tourner) et les requêtes futures.
    return {"success": True, "url_cps": filepath.replace("\\", "/")}