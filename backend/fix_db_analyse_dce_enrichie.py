# fix_db_analyse_dce_enrichie.py — à lancer UNE FOIS à la racine de backend/ :
#   python fix_db_analyse_dce_enrichie.py
#
# Corrige la dérive de schéma : Base.metadata.create_all() ne modifie jamais une
# table déjà existante, donc l'enrichissement du modèle AnalyseDce (objet_marche,
# prestations_attendues, livrables_attendus, contraintes_importantes,
# points_vigilance, recommandations) n'a pas été répercuté sur ta base sis.db
# existante. Sans ce script, le premier accès à analyse.objet_marche (ou tout
# autre nouveau champ) plante avec une erreur SQLite "no such column".
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

NOUVELLES_COLONNES = [
    ("objet_marche", "TEXT"),
    ("prestations_attendues", "TEXT"),
    ("livrables_attendus", "TEXT"),
    ("contraintes_importantes", "TEXT"),
    ("points_vigilance", "TEXT"),
    ("recommandations", "TEXT"),
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(analyse_dce)")
colonnes_existantes = {row[1] for row in cur.fetchall()}

for nom, type_sql in NOUVELLES_COLONNES:
    if nom not in colonnes_existantes:
        cur.execute(f"ALTER TABLE analyse_dce ADD COLUMN {nom} {type_sql}")
        print(f"Colonne '{nom}' ajoutée à analyse_dce.")
    else:
        print(f"Colonne '{nom}' déjà présente — rien à faire.")

conn.commit()
conn.close()