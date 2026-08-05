# migrate_analyse_dce_enrichie.py — à lancer UNE FOIS à la racine de backend/
# Ajoute les 6 nouvelles colonnes d'analyse enrichie à la table analyse_dce
# (objet_marche, prestations_attendues, livrables_attendus, contraintes_importantes,
# points_vigilance, recommandations). Toutes nullable -> simple ADD COLUMN, pas besoin
# de recréer la table.
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

NOUVELLES_COLONNES = [
    "objet_marche",
    "prestations_attendues",
    "livrables_attendus",
    "contraintes_importantes",
    "points_vigilance",
    "recommandations",
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(analyse_dce)")
colonnes_existantes = {row[1] for row in cur.fetchall()}

for colonne in NOUVELLES_COLONNES:
    if colonne not in colonnes_existantes:
        cur.execute(f"ALTER TABLE analyse_dce ADD COLUMN {colonne} TEXT")
        print(f"Colonne '{colonne}' ajoutée.")
    else:
        print(f"Colonne '{colonne}' déjà présente.")

conn.commit()
conn.close()
print("Migration terminée.")
