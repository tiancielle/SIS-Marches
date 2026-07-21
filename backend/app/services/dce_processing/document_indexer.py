"""Persiste les métadonnées + statut d'extraction de chaque fichier d'un DCE.

Idempotent : un nouvel appel pour le même appel_offres_id supprime d'abord les
DceDocument existants (le ré-extrait sur disque écrase de toute façon les .txt
précédents), pour permettre de relancer proprement le pipeline sans doublons.
"""
from sqlalchemy.orm import Session

from app.models.dce_document import DceDocument
from app.services.dce_processing.zip_extractor import ExtractedFile
from app.services.dce_processing.text_extractor import extract_text


def index_documents(db: Session, appel_offres_id: int, extracted_files: list[ExtractedFile], output_dir: str) -> list[DceDocument]:
    # Nettoyage des indexations précédentes pour repartir propre à chaque relance
    db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_offres_id).delete()
    db.flush()

    documents: list[DceDocument] = []

    for extracted_file in extracted_files:
        try:
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
        except Exception as exc:  # noqa: BLE001 — un fichier corrompu ne doit jamais arrêter le pipeline
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

        db.add(document)
        documents.append(document)

    db.commit()
    for document in documents:
        db.refresh(document)

    return documents
