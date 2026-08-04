"""
Suite de fix_fk_projets.py après l'échec de create_all (import de modèles incomplet).
Les tables contrats / dce / projet_equipe sont déjà renommées en *_old_broken
(données intactes) -- ce script importe TOUS les modèles (comme main.py) pour que
SQLAlchemy puisse résoudre toutes les FK, recrée les 3 tables avec le bon schéma,
puis recopie les données.

Usage (depuis backend/, avec sis_env activé, serveur arrêté) :
    python fix_fk_projets_step2.py
"""
from sqlalchemy import text, inspect
from app.core.database import engine, Base

# Import de TOUS les modèles, comme le fait main.py, pour que Base.metadata
# connaisse l'intégralité du schéma (indispensable pour résoudre les FK).
from app.models import projet, sous_traitant  # noqa: F401
from app.models import contrat  # noqa: F401
from app.models import dce  # noqa: F401
from app.models import equipe, projet_equipe  # noqa: F401
from app.models import appel_offres, analyse_ia  # noqa: F401
from app.models import dce_document, analyse_dce  # noqa: F401

TABLES = ["contrats", "dce", "projet_equipe"]

insp = inspect(engine)
existing = insp.get_table_names()

# Garde-fou : vérifie qu'on est bien dans l'état attendu avant de continuer
for t in TABLES:
    if f"{t}_old_broken" not in existing:
        raise SystemExit(f"ERREUR : {t}_old_broken introuvable -- l'état de la base "
                          f"ne correspond pas à ce qui est attendu. Arrêt sans rien faire.")
    if t in existing:
        raise SystemExit(f"ERREUR : {t} existe déjà -- create_all a peut-être déjà tourné. "
                          f"Vérifie manuellement avant de relancer. Arrêt sans rien faire.")

print("État vérifié : les 3 tables *_old_broken existent, les 3 tables cibles n'existent pas encore. On continue.")

Base.metadata.create_all(bind=engine)
print("Tables recréées avec la bonne contrainte FK (-> projets.id).")

with engine.begin() as conn:
    conn.execute(text("""
        INSERT INTO contrats (id, projet_id, sous_traitant_id, reference, montant,
                               date_debut, date_fin, statut, document_nom)
        SELECT id, projet_id, sous_traitant_id, reference, montant,
               date_debut, date_fin, statut, document_nom
        FROM contrats_old_broken
    """))
    conn.execute(text("""
        INSERT INTO dce (id, projet_id, objet, organisme, montant_estimatif,
                          date_limite_remise, type_procedure, pieces_exigees,
                          document_nom, date_creation)
        SELECT id, projet_id, objet, organisme, montant_estimatif,
               date_limite_remise, type_procedure, pieces_exigees,
               document_nom, date_creation
        FROM dce_old_broken
    """))
    conn.execute(text("""
        INSERT INTO projet_equipe (id, projet_id, equipe_id, role)
        SELECT id, projet_id, equipe_id, role
        FROM projet_equipe_old_broken
    """))
print("Données recopiées.")

with engine.connect() as conn:
    all_ok = True
    for t in TABLES:
        n_new = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        n_old = conn.execute(text(f"SELECT COUNT(*) FROM {t}_old_broken")).scalar()
        ok = n_new == n_old
        all_ok = all_ok and ok
        print(f"{t}: {n_old} (ancien) vs {n_new} (nouveau) -> {'OK' if ok else 'MISMATCH -- NE PAS SUPPRIMER, ALERTE'}")

if all_ok:
    print("\nTout est OK. Tu peux maintenant relancer le serveur et retester les projets 1 et 5, "
          "puis lancer fix_fk_projets_cleanup.py pour supprimer les tables *_old_broken.")
else:
    print("\nATTENTION : mismatch détecté, ne supprime rien, colle-moi cette sortie.")
