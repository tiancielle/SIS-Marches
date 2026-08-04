"""
Les tables contrats / dce / projet_equipe existent déjà avec la bonne FK (-> projets.id)
mais sont vides. Ce script recopie les données depuis les tables *_old_broken.

Usage : python fix_fk_projets_step3.py
"""
from sqlalchemy import text, inspect
from app.core.database import engine

insp = inspect(engine)
existing = insp.get_table_names()

for t in ["contrats", "dce", "projet_equipe", "contrats_old_broken", "dce_old_broken", "projet_equipe_old_broken"]:
    if t not in existing:
        raise SystemExit(f"ERREUR : {t} introuvable -- l'état de la base ne correspond pas à ce qui est "
                          f"attendu. Arrêt sans rien faire.")

with engine.connect() as conn:
    n_contrats = conn.execute(text("SELECT COUNT(*) FROM contrats")).scalar()
    n_dce = conn.execute(text("SELECT COUNT(*) FROM dce")).scalar()
    n_projet_equipe = conn.execute(text("SELECT COUNT(*) FROM projet_equipe")).scalar()

if n_contrats != 0 or n_dce != 0 or n_projet_equipe != 0:
    raise SystemExit(
        f"ERREUR : les tables cibles ne sont pas vides (contrats={n_contrats}, dce={n_dce}, "
        f"projet_equipe={n_projet_equipe}) -- la recopie a peut-être déjà eu lieu. "
        f"Arrêt sans rien faire, vérifie manuellement."
    )

print("État vérifié : tables cibles vides, tables sources présentes. On recopie.")

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
    for t, t_old in [("contrats", "contrats_old_broken"), ("dce", "dce_old_broken"), ("projet_equipe", "projet_equipe_old_broken")]:
        n_new = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        n_old = conn.execute(text(f"SELECT COUNT(*) FROM {t_old}")).scalar()
        ok = n_new == n_old
        all_ok = all_ok and ok
        print(f"{t}: {n_old} (ancien) vs {n_new} (nouveau) -> {'OK' if ok else 'MISMATCH -- ALERTE, NE SUPPRIME RIEN'}")

if all_ok:
    print("\nTout est OK. Relance le serveur, teste GET /projets/1 et GET /projets/5, "
          "puis lance fix_fk_projets_cleanup.py pour supprimer les tables *_old_broken.")
else:
    print("\nATTENTION : mismatch détecté, ne supprime rien, colle-moi cette sortie.")
