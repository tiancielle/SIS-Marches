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
import logging
import os
from sqlalchemy.orm import Session

from app.models.dce_document import DceDocument
from app.services.dce_processing.zip_extractor import ExtractedFile
from app.services.dce_processing.text_extractor import extract_text, ExtractionResult

logger = logging.getLogger(__name__)


def index_documents(db: Session, appel_offres_id: int, extracted_files: list[ExtractedFile], output_dir: str) -> list[DceDocument]:
    """
    Indexe en base de données les résultats d'extraction pour un appel d'offres donné.
    
    CHOIX DE CONCEPTION (IDEMPOTENCE) : On supprime systématiquement les enregistrements 
    existants pour cet `appel_offres_id` avant d'insérer les nouveaux. Cela garantit que 
    le pipeline peut être relancé à volonté (re-run) en cas de modification du code ou 
    d'ajout de fichiers, sans créer de doublons ni laisser de données orphelines obsolètes.
    """
    # Instrumentation : vérifier si des DceDocument existent déjà
    existing_docs = db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_offres_id).all()
    if existing_docs:
        logger.info(f"[PIPELINE] INDEX ......... REBUILD ({len(existing_docs)} documents supprimés pour réindexation)")
    else:
        logger.info(f"[PIPELINE] INDEX ......... RUN (pas de documents existants)")
    
    # Nettoyage des indexations précédentes pour repartir propre à chaque relance
    db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_offres_id).delete()
    
    # FLUSH : On force l'exécution de la requête DELETE en base de données immédiatement.
    # Cela garantit que la suppression est effective avant de commencer les INSERT, 
    # évitant tout conflit de contrainte d'unicité ou état transitoire incohérent.
    db.flush()

    documents: list[DceDocument] = []
    txt_files_rebuilt = 0
    txt_files_reused = 0
    
    # DIAGNOSTIC : Vérifier le dossier de sortie
    logger.info(f"[INDEX-DEBUG] output_dir = {output_dir}")
    if os.path.exists(output_dir):
        all_files = os.listdir(output_dir)
        txt_files = [f for f in all_files if f.endswith('.txt')]
        logger.info(f"[INDEX-DEBUG] Fichiers dans output_dir: {len(all_files)} fichiers, {len(txt_files)} fichiers .txt")
        logger.info(f"[INDEX-DEBUG] Liste fichiers .txt: {txt_files[:10]}")  # Premier 10 fichiers
    else:
        logger.error(f"[INDEX-DEBUG] output_dir n'existe pas: {output_dir}")

    for extracted_file in extracted_files:
        # Instrumentation : vérifier si le .txt existe déjà
        expected_txt_path = os.path.join(output_dir, f"{extracted_file.nom_fichier}.txt")
        txt_exists = os.path.exists(expected_txt_path)
        
        logger.info(f"[INDEX-DEBUG] Fichier: {extracted_file.nom_fichier}")
        logger.info(f"[INDEX-DEBUG] expected_txt_path = {expected_txt_path}")
        logger.info(f"[INDEX-DEBUG] txt_exists = {txt_exists}")
        
        try:
            if txt_exists:
                # Réutiliser le texte existant (éviter l'OCR coûteux)
                logger.info(f"[INDEX] Texte déjà disponible pour {extracted_file.nom_fichier} — réutilisation")
                with open(expected_txt_path, "r", encoding="utf-8") as f:
                    content = f.read()
                result = ExtractionResult(
                    texte_extrait_path=expected_txt_path,
                    nb_caracteres=len(content),
                    statut="succes",
                    erreur=None
                )
                txt_files_reused += 1
            else:
                # Appel du module d'extraction (qui gère lui-même ses propres replis et l'OCR)
                # Passer le flag is_cps_confirmed si le fichier a été marqué par le pipeline
                is_cps_confirmed = getattr(extracted_file, '_is_cps_confirmed', False)
                result = extract_text(extracted_file, output_dir, is_cps_confirmed=is_cps_confirmed)
            
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
    
    # Instrumentation : log des fichiers .txt
    if txt_files_reused > 0:
        logger.info(f"[PIPELINE] TXT ............ REUSE ({txt_files_reused} fichiers .txt réutilisés)")
    if txt_files_rebuilt > 0:
        logger.info(f"[PIPELINE] TXT ............ REBUILD ({txt_files_rebuilt} fichiers .txt régénérés)")
    if txt_files_reused == 0 and txt_files_rebuilt == 0:
        logger.info(f"[PIPELINE] TXT ............ RUN (pas de fichiers .txt existants)")
    
    return documents