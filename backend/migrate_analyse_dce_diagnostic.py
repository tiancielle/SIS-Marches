# migrate_analyse_dce_diagnostic.py — à lancer UNE FOIS à la racine de backend/ :
#   python migrate_analyse_dce_diagnostic.py
#
# Ajoute 2 colonnes de diagnostic à analyse_dce : contexte_tronque (le contexte
# envoyé au LLM a-t-il été raccourci ?) et nb_caracteres_contexte (taille réelle
# envoyée). Objectif : ne plus jamais avoir à deviner si un résumé court vient
# d'une troncature de contexte ou d'un problème de prompt/modèle (cf. audit du
# 24/07 : des .doc de 47k+ caractères étaient tronqués à 20k avant d'atteindre le LLM).
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(analyse_dce)")
colonnes_existantes = {row[1] for row in cur.fetchall()}

if "contexte_tronque" not in colonnes_existantes:
    cur.execute("ALTER TABLE analyse_dce ADD COLUMN contexte_tronque BOOLEAN")
    print("Colonne 'contexte_tronque' ajoutée.")
else:
    print("Colonne 'contexte_tronque' déjà présente.")

if "nb_caracteres_contexte" not in colonnes_existantes:
    cur.execute("ALTER TABLE analyse_dce ADD COLUMN nb_caracteres_contexte INTEGER")
    print("Colonne 'nb_caracteres_contexte' ajoutée.")
else:
    print("Colonne 'nb_caracteres_contexte' déjà présente.")

conn.commit()
conn.close()
print("Migration terminée.")