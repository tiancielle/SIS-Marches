"""
Persiste les métadonnées + statut d'extraction de chaque fichier d'un DCE.

Idempotent : un nouvel appel pour le même appel_offres_id supprime d'abord les
DceDocument existants (le ré-extrait sur disque écrase de toute façon les .txt
précédents), pour permettre de relancer proprement le pipeline sans doublons.

Justification architecturale : Ce module assure la liaison entre le système de fichiers 
(les textes extraits) et la base de données (les métadonnées). Il est conçu pour être 
robuste et traçable : chaque tentative d'extraction, qu'elle réussisse ou échoue, 
est enregistrée en base pour garantir une auditabilité complète du pipeline d'ingestion.
"""
from sqlalchemy.orm import Session

from app.models.dce_document import DceDocument
from app.services.dce_processing.zip_extractor import ExtractedFile
from app.services.dce_processing.text_extractor import extract_text


def index_documents(db: Session, appel_offres_id: int, extracted_files: list[ExtractedFile], output_dir: str) -> list[DceDocument]:
    """
    Indexe en base de données les résultats d'extraction pour un appel d'offres donné.
    
    CHOIX DE CONCEPTION (IDEMPOTENCE) : On supprime systématiquement les enregistrements 
    existants pour cet `appel_offres_id` avant d'insérer les nouveaux. Cela garantit que 
    le pipeline peut être relancé à volonté (re-run) en cas de modification du code ou 
    d'ajout de fichiers, sans créer de doublons ni laisser de données orphelines obsolètes.
    """
    # Nettoyage des indexations précédentes pour repartir propre à chaque relance
    db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_offres_id).delete()
    
    # FLUSH : On force l'exécution de la requête DELETE en base de données immédiatement.
    # Cela garantit que la suppression est effective avant de commencer les INSERT, 
    # évitant tout conflit de contrainte d'unicité ou état transitoire incohérent.
    db.flush()

    documents: list[DceDocument] = []

    for extracted_file in extracted_files:
        try:
            # Appel du module d'extraction (qui gère lui-même ses propres replis et l'OCR)
            result = extract_text(extracted_file, output_dir)
            
            document = DceDocument(
                appel_offres_id=appel_offres_id,
                nom_fichier=extracted_file.nom_fichier,
                chemin_relatif=extracted_file.relative_path,
                type_fichier=extracted_file.extension or "autre",
                taille_octets=extracted_file.taille_octets,
                texte_extrait_path=result.texte_extrait_path,
                nb_caracteres_extraits=result.nb_caracteres,
                statut_extraction=result.statut,
                erreur=result.erreur,
            )
        except Exception as exc:  # noqa: BLE001
            # TOLÉRANCE AUX PANNES (Graceful Degradation) : 
            # Dans un traitement par lots, un fichier exceptionnellement corrompu ou une 
            # erreur inattendue (ex: problème de permissions disque) ne doit JAMAIS faire 
            # planter l'ingestion de l'ensemble des autres fichiers du même DCE.
            # On capture l'erreur et on la persiste en base pour que l'administrateur 
            # puisse identifier et corriger le problème spécifique plus tard.
            document = DceDocument(
                appel_offres_id=appel_offres_id,
                nom_fichier=extracted_file.nom_fichier,
                chemin_relatif=extracted_file.relative_path,
                type_fichier=extracted_file.extension or "autre",
                taille_octets=extracted_file.taille_octets,
                texte_extrait_path=None,
                nb_caracteres_extraits=0,
                statut_extraction="echec",
                erreur=f"Erreur inattendue pendant l'extraction : {exc}",
            )

        # Ajout à la session SQLAlchemy (l'insertion réelle en base est différée jusqu'au commit)
        db.add(document)
        documents.append(document)

    # COMMIT GROUPÉ : On valide toutes les insertions en une seule transaction.
    # C'est beaucoup plus performant qu'un commit à chaque itération de la boucle,
    # tout en garantissant l'atomicité de l'opération d'indexation du lot.
    db.commit()
    
    # REFRESH : On récupère les valeurs générées par la base de données (comme l'ID auto-incrémenté)
    # pour que la liste d'objets retournée soit parfaitement synchronisée avec l'état réel de la BDD.
    # Cela évite des bugs subtils si le code appelant utilise ces objets juste après l'appel.
    for document in documents:
        db.refresh(document)
    
    return documents

    return documents