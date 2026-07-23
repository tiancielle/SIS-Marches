# migrate_projet_v2.py — à lancer UNE FOIS à la racine de backend/ : python migrate_projet_v2.py
#
# Migration complète du modèle Projet vers le schéma V2 :
# - nouvelles colonnes : appel_offres_id, origine, description, chef_id, date_soumission, date_creation
# - client/lieu/budget/debut/fin/chef deviennent nullable (obligatoire de recréer la table en SQLite,
#   un simple ALTER TABLE ADD COLUMN ne permet pas de changer une contrainte NOT NULL existante)
# - mapping des anciens statuts V1 vers le cycle de vie V2 :
#     'actif'   -> 'en_execution'  (hypothèse : un projet "actif" en V1 était déjà en cours d'exécution)
#     'termine' -> 'termine'       (inchangé)
#     autre statut déjà présent   -> conservé tel quel
#   Si cette hypothèse ne correspond pas à tes données réelles, corrige manuellement
#   après coup (les id sont préservés, rien d'autre ne change).
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

STATUT_MAPPING = {
    "actif": "en_execution",
    "termine": "termine",
}

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("PRAGMA table_info(projets)")
colonnes_actuelles = {row[1] for row in cur.fetchall()}

if "appel_offres_id" in colonnes_actuelles and "chef_id" in colonnes_actuelles:
    print("La table 'projets' a déjà l'air migrée (appel_offres_id et chef_id présents) — rien à faire.")
else:
    cur.execute("SELECT id, nom, client, lieu, budget, debut, fin, statut, chef, budget_engage FROM projets")
    anciennes_lignes = cur.fetchall()
    print(f"{len(anciennes_lignes)} Projet(s) existant(s) à migrer.")

    cur.execute("ALTER TABLE projets RENAME TO projets_old_v1")

    cur.execute("""
        CREATE TABLE projets (
            id INTEGER PRIMARY KEY,
            appel_offres_id INTEGER UNIQUE REFERENCES appel_offres(id),
            origine TEXT NOT NULL DEFAULT 'manuel',
            nom TEXT NOT NULL,
            client TEXT,
            lieu TEXT,
            description TEXT,
            budget REAL,
            budget_engage REAL DEFAULT 0,
            debut DATE,
            fin DATE,
            chef TEXT,
            chef_id INTEGER REFERENCES equipe(id),
            statut TEXT NOT NULL DEFAULT 'interesse',
            date_soumission DATE,
            date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    for (id_, nom, client, lieu, budget, debut, fin, statut, chef, budget_engage) in anciennes_lignes:
        nouveau_statut = STATUT_MAPPING.get(statut, statut)
        cur.execute(
            """INSERT INTO projets
               (id, appel_offres_id, origine, nom, client, lieu, description, budget,
                budget_engage, debut, fin, chef, chef_id, statut, date_soumission, date_creation)
               VALUES (?, NULL, 'manuel', ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?, NULL, CURRENT_TIMESTAMP)""",
            (id_, nom, client, lieu, budget, budget_engage, debut, fin, chef, nouveau_statut),
        )

    cur.execute("DROP TABLE projets_old_v1")
    print(f"Table 'projets' migrée vers le schéma V2. {len(anciennes_lignes)} ligne(s) reportée(s).")
    print("Mapping de statut appliqué : 'actif' -> 'en_execution', 'termine' -> 'termine'.")
    print("Vérifie ces statuts après migration si l'hypothèse ne correspond pas à tes données.")

conn.commit()
conn.close()
