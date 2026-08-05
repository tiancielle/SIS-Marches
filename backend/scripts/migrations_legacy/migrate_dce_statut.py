# migrate_dce_statut.py — à lancer UNE FOIS à la racine de backend/ : python migrate_dce_statut.py
# Ajoute les colonnes dce_statut / dce_erreur à appel_offres (nouvelles depuis
# l'audit lazy loading), et backfill dce_statut à partir de url_cps existant.
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(appel_offres)")
colonnes = {row[1] for row in cur.fetchall()}

if "dce_statut" not in colonnes:
    cur.execute("ALTER TABLE appel_offres ADD COLUMN dce_statut TEXT NOT NULL DEFAULT 'NON_TELECHARGE'")
    print("Colonne 'dce_statut' ajoutée.")
else:
    print("Colonne 'dce_statut' déjà présente.")

if "dce_erreur" not in colonnes:
    cur.execute("ALTER TABLE appel_offres ADD COLUMN dce_erreur TEXT")
    print("Colonne 'dce_erreur' ajoutée.")
else:
    print("Colonne 'dce_erreur' déjà présente.")

# Backfill : tout AO qui a déjà un url_cps renseigné passe à 'TELECHARGE'
cur.execute("UPDATE appel_offres SET dce_statut = 'TELECHARGE' WHERE url_cps IS NOT NULL AND url_cps != ''")
print(f"{cur.rowcount} AppelOffres avec url_cps existant marqués 'TELECHARGE'.")

conn.commit()
conn.close()
