"""
Ajoute la colonne url_avis sur `projets` et rétro-remplit sa valeur pour les
Projets déjà créés via /interesser (appel_offres_id non nul), en la copiant
depuis l'AppelOffres d'origine.

Contrairement à la correction FK précédente, pas besoin de recréer la table --
SQLite supporte ADD COLUMN directement.

À lancer APRÈS avoir appliqué les 4 diffs de code (modèle + schéma + routeurs),
sinon Base.metadata.create_all pourrait tenter de recréer une table déjà à jour
sans la colonne si elle est appelée avant la migration -- l'ordre importe ici.

Usage : python add_url_avis.py
"""
from sqlalchemy import text, inspect
from app.core.database import engine

insp = inspect(engine)
existing_columns = {c["name"] for c in insp.get_columns("projets")}

if "url_avis" in existing_columns:
    print("La colonne url_avis existe déjà sur `projets` -- rien à faire.")
else:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE projets ADD COLUMN url_avis VARCHAR"))
    print("Colonne url_avis ajoutée à `projets`.")

with engine.begin() as conn:
    result = conn.execute(text("""
        UPDATE projets
        SET url_avis = (
            SELECT appel_offres.url_avis
            FROM appel_offres
            WHERE appel_offres.id = projets.appel_offres_id
        )
        WHERE appel_offres_id IS NOT NULL
          AND url_avis IS NULL
    """))
    print(f"Rétro-remplissage effectué ({result.rowcount} projet(s) mis à jour).")

with engine.connect() as conn:
    rows = conn.execute(text(
        "SELECT id, nom, appel_offres_id, url_avis FROM projets WHERE appel_offres_id IS NOT NULL"
    )).fetchall()
    print("\nVérification -- projets issus d'un AO :")
    for r in rows:
        print(f"  id={r[0]:<4} nom={r[1][:40]!r:<45} appel_offres_id={r[2]}  url_avis={r[3]!r}")