# reset_sync_lock.py — à lancer UNE FOIS à la racine de backend/ : python reset_sync_lock.py
# Débloque le verrou `en_cours` resté coincé à True suite à un redémarrage du serveur
# pendant une synchronisation (ex: --reload qui relance le process en cours de route).
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sis.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("SELECT id, en_cours, derniere_synchro FROM sync_state WHERE source = 'appel_offres'")
row = cur.fetchone()

if row is None:
    print("Aucun sync_state trouvé — rien à faire.")
else:
    sync_id, en_cours, derniere_synchro = row
    print(f"État actuel : en_cours={en_cours}, derniere_synchro={derniere_synchro}")
    cur.execute("UPDATE sync_state SET en_cours = 0 WHERE id = ?", (sync_id,))
    conn.commit()
    print("Verrou débloqué (en_cours remis à 0).")

conn.close()
