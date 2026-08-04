"""
À lancer UNIQUEMENT après avoir vérifié que fix_fk_projets.py a affiché "OK" pour
les 3 tables, et idéalement après avoir aussi vérifié à l'oeil le contenu (ex. via
DB Browser for SQLite ou une requête SELECT * simple sur chaque nouvelle table).

Usage :
    python fix_fk_projets_cleanup.py
"""
from sqlalchemy import text
from app.core.database import engine

TABLES = ["contrats", "dce", "projet_equipe"]

with engine.begin() as conn:
    for t in TABLES:
        conn.execute(text(f"DROP TABLE {t}_old_broken"))
        print(f"Supprimé : {t}_old_broken")

print("Nettoyage terminé.")
