from app.core.database import engine
from app.models.historique_evenement import HistoriqueEvenement

def create_historique_table():
    HistoriqueEvenement.__table__.create(engine, checkfirst=True)
    print("Table 'historique_evenements' créée avec succès.")

if __name__ == "__main__":
    create_historique_table()
