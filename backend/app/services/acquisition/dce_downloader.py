"""
Parcours complet de retrait du DCE : fiche -> formulaire d'identité ->
déclenchement -> téléchargement du zip. Confirmé par capture HAR.

LIMITE CONNUE : ne gère pas encore les consultations multi-lots
(widget de sélection de lot type VirtualSelect). Pour ces cas, le
téléchargement échouera probablement silencieusement (page renvoyée
inchangée) -- à traiter séparément si besoin.
"""
import os
from bs4 import BeautifulSoup
from app.core.config import settings
from .normalizer import extract_form_fields
from .detail_navigator import build_detail_url

DOWNLOAD_URL_TEMPLATE = (
    f"{settings.portal_base_url}/index.php?page=entreprise.EntrepriseDemandeTelechargementDce"
    "&refConsultation={ref_consultation}&orgAcronyme={org_acronyme}"
)


def download_dce(client, ref_consultation: str, org_acronyme: str) -> dict:
    detail_url = build_detail_url(ref_consultation, org_acronyme)
    telechargement_url = DOWNLOAD_URL_TEMPLATE.format(
        ref_consultation=ref_consultation, org_acronyme=org_acronyme
    )

    resp2 = client.get(telechargement_url, headers={"Referer": detail_url})
    soup_dl = BeautifulSoup(resp2.text, "lxml")
    form_data = extract_form_fields(soup_dl)

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

    resp3 = client.post(telechargement_url, data=form_data, headers={"Referer": telechargement_url})
    soup_final = BeautifulSoup(resp3.text, "lxml")
    form_data_final = extract_form_fields(soup_final)

    form_data_final["PRADO_POSTBACK_TARGET"] = "ctl0$CONTENU_PAGE$EntrepriseDownloadDce$completeDownload"
    form_data_final["PRADO_POSTBACK_PARAMETER"] = ""

    resp4 = client.post(
        telechargement_url, data=form_data_final,
        headers={"Referer": telechargement_url}, allow_redirects=False,
    )

    if resp4.status_code not in (301, 302) or not resp4.headers.get("Location"):
        return {"success": False, "reason": f"Pas de redirection (status {resp4.status_code})"}

    final_url = settings.portal_base_url + "/" + resp4.headers["Location"].lstrip("/")
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

    if "zip" not in resp5.headers.get("Content-Type", ""):
        return {"success": False, "reason": "Réponse inattendue (pas un zip)", "status": resp5.status_code}

    os.makedirs(settings.dce_storage_path, exist_ok=True)
    filename = f"dce_{ref_consultation}_{org_acronyme}.zip"
    filepath = os.path.join(settings.dce_storage_path, filename)
    with open(filepath, "wb") as f:
        f.write(resp5.content)

    return {"success": True, "url_cps": filepath}