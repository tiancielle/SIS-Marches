"""
Récupère un exemple réel du contenu des colonnes TEXT (JSON stringifié) de
analyse_dce, pour un AO qui a une analyse complète -- utile pour que le
frontend sache exactement quel format parser.

Usage : python sample_analyse_dce.py [appel_offres_id]
Par défaut, prend le premier appel_offres_id avec statut='complete' ou 'partielle'.
"""
import sys
from sqlalchemy import text
from app.core.database import engine

TEXT_FIELDS = [
    "resume", "objet_marche", "prestations_attendues", "competences_recherchees",
    "technologies_mentionnees", "pieces_administratives", "livrables_attendus",
    "contraintes_importantes", "criteres_evaluation", "delais_importants",
    "points_vigilance", "recommandations", "budget",
]

appel_id = sys.argv[1] if len(sys.argv) > 1 else None

with engine.connect() as conn:
    if appel_id is None:
        row = conn.execute(text(
            "SELECT appel_offres_id FROM analyse_dce WHERE statut IN ('complete', 'partielle') LIMIT 1"
        )).first()
        if row is None:
            raise SystemExit("Aucune analyse complète/partielle trouvée en base.")
        appel_id = row[0]

    print(f"--- analyse_dce pour appel_offres_id={appel_id} ---\n")
    row = conn.execute(text(
        f"SELECT {', '.join(TEXT_FIELDS)} FROM analyse_dce WHERE appel_offres_id = :aid"
    ), {"aid": appel_id}).first()

    if row is None:
        raise SystemExit(f"Aucune analyse trouvée pour appel_offres_id={appel_id}.")

    for field, value in zip(TEXT_FIELDS, row):
        print(f"{field}:")
        print(f"  {value!r}\n")
