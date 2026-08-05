"""
Diagnostic : état actuel des tables concernées par la migration FK.
Ne modifie rien.

Usage : python diag_fk_state.py
"""
from sqlalchemy import inspect, text
from app.core.database import engine

from app.models import projet, sous_traitant  # noqa: F401
from app.models import contrat  # noqa: F401
from app.models import dce  # noqa: F401
from app.models import equipe, projet_equipe  # noqa: F401
from app.models import appel_offres, analyse_ia  # noqa: F401
from app.models import dce_document, analyse_dce  # noqa: F401

insp = inspect(engine)
existing = insp.get_table_names()

print("Tables présentes dans la base :")
for t in sorted(existing):
    print(f"  - {t}")

print()

for t in ["contrats", "dce", "projet_equipe", "contrats_old_broken", "dce_old_broken", "projet_equipe_old_broken"]:
    if t not in existing:
        print(f"{t} : ABSENTE")
        continue
    with engine.connect() as conn:
        n = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
    fks = insp.get_foreign_keys(t)
    fk_desc = "; ".join(f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}" for fk in fks) or "aucune FK"
    print(f"{t} : {n} ligne(s), FK: {fk_desc}")
