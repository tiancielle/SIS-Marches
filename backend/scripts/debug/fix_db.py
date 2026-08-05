# fix_db_dce_statut.py — à lancer UNE FOIS à la racine de backend/ : python fix_db_dce_statut.py
# Corrige la dérive de schéma : Base.metadata.create_all() ne modifie jamais une
# table déjà existante, donc l'ajout de `dce_statut`/`dce_erreur` au modèle
# AppelOffres n'a pas été répercuté sur ta base sis.db existante.
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(appel_offres)")
colonnes_existantes = {row[1] for row in cur.fetchall()}

if "dce_statut" not in colonnes_existantes:
    cur.execute("ALTER TABLE appel_offres ADD COLUMN dce_statut VARCHAR DEFAULT 'NON_TELECHARGE'")
    print("Colonne 'dce_statut' ajoutée à appel_offres.")
else:
    print("Colonne 'dce_statut' déjà présente — rien à faire.")

if "dce_erreur" not in colonnes_existantes:
    cur.execute("ALTER TABLE appel_offres ADD COLUMN dce_erreur TEXT")
    print("Colonne 'dce_erreur' ajoutée à appel_offres.")
else:
    print("Colonne 'dce_erreur' déjà présente — rien à faire.")

# Rattraper les lignes existantes : celles qui ont déjà un url_cps rempli sont
# de facto déjà téléchargées, mais viennent d'hériter du défaut NON_TELECHARGE.
cur.execute(
    "UPDATE appel_offres SET dce_statut = 'TELECHARGE' "
    "WHERE url_cps IS NOT NULL AND (dce_statut IS NULL OR dce_statut = 'NON_TELECHARGE')"
)
print(f"{cur.rowcount} ligne(s) avec url_cps déjà rempli passée(s) en dce_statut='TELECHARGE'.")

conn.commit()
conn.close()