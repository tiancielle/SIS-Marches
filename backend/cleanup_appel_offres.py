# cleanup_appel_offres.py — à la racine de backend/, à lancer avec python cleanup_appel_offres.py

import sys
sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.appel_offres import AppelOffres
from app.services.acquisition.domain_filter import is_relevant

DRY_RUN = True  # passe à False pour vraiment supprimer

db = SessionLocal()
try:
    all_appels = db.query(AppelOffres).all()
    print(f"{len(all_appels)} appels d'offres en base au total\n")

    a_supprimer = [a for a in all_appels if not is_relevant(a.objet, a.organisme)]
    a_garder = [a for a in all_appels if is_relevant(a.objet, a.organisme)]

    print(f"{len(a_garder)} pertinents (conservés)")
    print(f"{len(a_supprimer)} non pertinents (à supprimer)\n")

    print("=== Aperçu de ce qui sera supprimé ===")
    for a in a_supprimer[:20]:
        print(f"  [{a.reference}] {(a.objet or '')[:80]}")

    if not DRY_RUN:
        for a in a_supprimer:
            db.delete(a)
        db.commit()
        print(f"\n{len(a_supprimer)} appel(s) d'offres supprimé(s).")
    else:
        print("\nDRY_RUN activé — rien n'a été supprimé. Repasse DRY_RUN à False pour confirmer.")
finally:
    db.close()