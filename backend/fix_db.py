# fix_db.py — à lancer UNE FOIS à la racine de backend/ : python fix_db.py
# Corrige la dérive de schéma : Base.metadata.create_all() ne modifie jamais une
# table déjà existante, donc l'ajout de `en_cours` au modèle SyncState n'a pas été
# répercuté sur ta base sis.db existante.
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(sync_state)")
colonnes_existantes = {row[1] for row in cur.fetchall()}

if "en_cours" not in colonnes_existantes:
    cur.execute("ALTER TABLE sync_state ADD COLUMN en_cours BOOLEAN DEFAULT 0")
    conn.commit()
    print("Colonne 'en_cours' ajoutée à sync_state.")
else:
    print("Colonne 'en_cours' déjà présente — rien à faire.")

conn.close()
