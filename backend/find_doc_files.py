import sqlite3
c = sqlite3.connect("sis.db")
rows = c.execute(
    "SELECT appel_offres_id, nom_fichier, statut_extraction FROM dce_document WHERE type_fichier = 'doc'"
).fetchall()
if not rows:
    print("Aucun fichier .doc trouve dans dce_document.")
else:
    for r in rows:
        print(r)
