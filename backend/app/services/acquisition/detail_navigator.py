"""
La fiche détail est accessible directement par URL (confirmé par capture HAR) :
pas de postback nécessaire, juste refConsultation + orgAcronyme.
"""
from app.core.config import settings

DETAIL_URL_TEMPLATE = (
    f"{settings.portal_base_url}/index.php?page=entreprise.EntrepriseDetailConsultation"
    "&refConsultation={ref_consultation}&orgAcronyme={org_acronyme}"
)


def build_detail_url(ref_consultation: str, org_acronyme: str) -> str:
    return DETAIL_URL_TEMPLATE.format(ref_consultation=ref_consultation, org_acronyme=org_acronyme)


def open_detail(client, ref_consultation: str, org_acronyme: str, referer: str) -> str:
    url = build_detail_url(ref_consultation, org_acronyme)
    resp = client.get(url, headers={"Referer": referer})
    return resp.text