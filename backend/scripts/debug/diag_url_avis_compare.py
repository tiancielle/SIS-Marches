from sqlalchemy import text
from app.core.database import engine

ids_sans = [128, 126, 127, 129, 122, 125, 121]

with engine.connect() as conn:
    print("--- AO SANS url_avis (nos 7) ---")
    for i in ids_sans:
        row = conn.execute(text(
            "SELECT id, reference, ref_consultation, org_acronyme, date_import, url_avis "
            "FROM appel_offres WHERE id = :i"
        ), {"i": i}).first()
        print(row)

    print("\n--- Exemples d'AO AVEC url_avis (5 au hasard) ---")
    rows = conn.execute(text(
        "SELECT id, reference, ref_consultation, org_acronyme, date_import, url_avis "
        "FROM appel_offres WHERE url_avis IS NOT NULL AND url_avis != '' LIMIT 5"
    )).fetchall()
    for r in rows:
        print(r)
