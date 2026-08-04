"""
Affiche toutes les tables, colonnes et clés étrangères de la base configurée
dans app.core.database (SIS-Marches backend).

Usage (depuis backend/, avec sis_env activé) :
    python inspect_schema.py
"""
from sqlalchemy import inspect
from app.core.database import engine

insp = inspect(engine)

for table_name in insp.get_table_names():
    print(f"--- {table_name} ---")

    for col in insp.get_columns(table_name):
        print(f"  {col['name']:30} {col['type']}  nullable={col['nullable']}")

    for fk in insp.get_foreign_keys(table_name):
        print(f"  FK: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")

    print()