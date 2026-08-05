"""
Script de migration pour ajouter le champ workflow_state à la table projets.
Exécutez ce script une seule fois : python add_workflow_state.py
"""
from sqlalchemy import text, inspect
from app.core.database import engine, SessionLocal
from app.models.projet import Projet

def migrate():
    """Ajoute le champ workflow_state à la table projets avec la valeur par défaut 'opportunite'."""
    db = SessionLocal()
    try:
        # Vérifier si la colonne existe déjà
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('projets')]
        
        if 'workflow_state' in columns:
            print("OK: La colonne workflow_state existe deja.")
            return
        
        # Ajouter la colonne
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE projets ADD COLUMN workflow_state VARCHAR DEFAULT 'opportunite' NOT NULL"))
            conn.commit()
        
        print("OK: Colonne workflow_state ajoutee avec succes.")
        
        # Mettre à jour les enregistrements existants selon leur statut
        projets = db.query(Projet).all()
        updated = 0
        for projet in projets:
            if projet.statut in ["interesse", "en_preparation", "pret_a_deposer", "soumis"]:
                projet.workflow_state = "opportunite"
            elif projet.statut in ["en_execution", "actif", "suspendu", "termine"]:
                projet.workflow_state = "projet"
            elif projet.statut in ["perdu", "abandonne", "ignore"]:
                projet.workflow_state = "archive"
            else:
                projet.workflow_state = "opportunite"  # défaut
            updated += 1
        
        db.commit()
        print(f"OK: {updated} projets mis a jour avec workflow_state.")
        
    except Exception as e:
        print(f"ERROR: Erreur lors de la migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
