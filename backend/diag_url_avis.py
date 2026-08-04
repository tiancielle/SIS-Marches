from sqlalchemy import text
from app.core.database import engine

ids = [128, 126, 127, 129, 122, 125, 121]

with engine.connect() as conn:
    print("Vérification appel_offres.url_avis pour les AO concernés :\n")
    for i in ids:
        row = conn.execute(text(
            "SELECT id, reference, url_avis FROM appel_offres WHERE id = :i"
        ), {"i": i}).first()
        print(row)

    print("\nCompte global sur toute la table appel_offres :")
    total = conn.execute(text("SELECT COUNT(*) FROM appel_offres")).scalar()
    non_null = conn.execute(text("SELECT COUNT(*) FROM appel_offres WHERE url_avis IS NOT NULL AND url_avis != ''")).scalar()
    print(f"  total={total}  url_avis renseignée={non_null}")
    