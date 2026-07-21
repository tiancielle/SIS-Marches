# wipe_appel_offres.py — à lancer UNE FOIS à la racine de backend/ : python wipe_appel_offres.py
# Supprime TOUS les AppelOffres existants ainsi que leurs DceDocument/AnalyseDce liés,
# pour repartir sur une base vide et laisser la prochaine synchro repeupler proprement
# (verrou débloqué + filtre de domaine actif).
#
# N'y touche PAS : Projet, Contrat, SousTraitant, Equipe, DCE (module 1:1 existant) —
# rien de ça ne dépend d'AppelOffres dans le schéma actuel du projet.

import sys
sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.appel_offres import AppelOffres
from app.models.dce_document import DceDocument
from app.models.analyse_dce import AnalyseDce

DRY_RUN = False  # passe à False pour vraiment supprimer

db = SessionLocal()
try:
    nb_ao = db.query(AppelOffres).count()
    nb_documents = db.query(DceDocument).count()
    nb_analyses = db.query(AnalyseDce).count()

    print(f"{nb_ao} AppelOffres en base")
    print(f"{nb_documents} DceDocument liés")
    print(f"{nb_analyses} AnalyseDce liées")

    if DRY_RUN:
        print("\nDRY_RUN activé — rien n'a été supprimé. Repasse DRY_RUN à False pour confirmer.")
    else:
        db.query(AnalyseDce).delete()
        db.query(DceDocument).delete()
        db.query(AppelOffres).delete()
        db.commit()
        print(f"\nSupprimé : {nb_ao} AppelOffres, {nb_documents} DceDocument, {nb_analyses} AnalyseDce.")
        print("Table vide — la prochaine synchro repartira de zéro.")
finally:
    db.close()
