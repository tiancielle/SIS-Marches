"""
Dézippage d'un DCE téléchargé : liste chaque fichier utile avec ses métadonnées.

Les zips réels observés sur le portail contiennent :
- des noms de fichiers accentués, avec espaces en fin de nom de dossier ("AO SP4130189 ")
- parfois un encodage CP437 mal interprété (mojibake) plutôt que de l'UTF-8 déclaré
- des fichiers parasites (verrous Office ~$..., ~WRL*.tmp, Thumbs.db, .DS_Store, __MACOSX/)
  qui n'ont aucune valeur informative et doivent être ignorés silencieusement.

Justification architecturale : Cette étape constitue le premier filtre de qualité des données 
(Data Cleaning). En éliminant proactivement le bruit (fichiers système, temporaires) et en 
sécurisant l'extraction, on garantit que le pipeline de traitement en aval (NLP, OCR) ne 
consomme pas de ressources de calcul pour des fichiers inutiles, corrompus ou malveillants.
"""
import os
import zipfile
import logging
from dataclasses import dataclass

from app.core.config import settings

logger = logging.getLogger(__name__)

# Préfixes/suffixes de fichiers parasites à ignorer systématiquement.
# CHOIX DE CONCEPTION : On filtre au niveau du nom de fichier pour éviter d'extraire 
# et de traiter des artefacts du système d'exploitation ou des logiciels (ex: verrous Office), 
# qui généreraient du "bruit" inexploitable et fausseraient les statistiques du pipeline.
_JUNK_PATTERNS = ("~$", "~wrl", "thumbs.db", ".ds_store", "desktop.ini")
_JUNK_DIR_MARKERS = ("__macosx",)


@dataclass
class ExtractedFile:
    """
    Représente un fichier extrait du ZIP avec ses métadonnées.
    Séparation des préoccupations : on conserve à la fois le chemin système sécurisé 
    (absolute_path) pour le traitement technique, et le chemin/nom original (relative_path, 
    nom_fichier) pour la traçabilité, l'audit et l'affichage dans l'interface utilisateur.
    """
    absolute_path: str
    relative_path: str      # chemin relatif tel qu'il apparaissait dans le zip (sous-dossiers conservés)
    nom_fichier: str        # nom de fichier seul, original (accents/espaces conservés)
    extension: str          # sans le point, en minuscule ("pdf", "docx", ...)
    taille_octets: int


class ZipExtractionError(Exception):
    """Le zip lui-même est illisible/corrompu — rien n'a pu être extrait."""


def _fix_filename_encoding(raw_name: str) -> str:
    """
    Corrige les problèmes d'encodage des noms de fichiers dans les archives ZIP.
    
    JUSTIFICATION TECHNIQUE : La bibliothèque standard `zipfile` de Python décode par défaut 
    les noms en CP437 (encodage DOS historique) si le drapeau UTF-8 n'est pas explicitement 
    positionné dans l'en-tête du fichier ZIP. Cela crée du "mojibake" (caractères corrompus) 
    pour les noms accentués générés par des outils Windows ou PHP côté portail.
    Cette fonction tente une ré-encodage CP437 -> décodage UTF-8, qui résout le cas le plus fréquent.
    En cas d'échec, on conserve le nom brut (fallback robuste) plutôt que de faire planter le pipeline.
    """
    try:
        return raw_name.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return raw_name


def _is_junk(relative_path: str) -> bool:
    """
    Détecte si un fichier est un artefact système ou temporaire à ignorer.
    
    LOGIQUE DE FILTRAGE : La vérification est insensible à la casse (`.lower()`). 
    On vérifie à la fois la présence de marqueurs de répertoire (ex: __MACOSX) 
    et les motifs de noms de fichiers (préfixes pour les fichiers temporaires, 
    correspondance exacte ou suffixe pour les fichiers cachés comme .DS_Store).
    On ignore également les fichiers .txt générés par notre pipeline (CPS.txt, RC.txt, etc.).
    """
    lowered = relative_path.lower()
    if any(marker in lowered for marker in _JUNK_DIR_MARKERS):
        return True
    filename = os.path.basename(lowered)
    
    # Ignorer les fichiers générés par notre pipeline (.txt)
    if filename.endswith(".txt"):
        return True
    
    return any(filename.startswith(p) or filename == p for p in _JUNK_PATTERNS if not p.startswith("."))\
        or any(filename == p or filename.endswith(p) for p in _JUNK_PATTERNS if p.startswith("."))


def _sanitize_for_filesystem(relative_path: str) -> str:
    """
    Nettoie un chemin pour qu'il soit sûr à écrire sur disque, sans altérer le nom 
    original conservé dans les métadonnées (pour l'audit et l'UI).
    
    SÉCURITÉ ET COMPATIBILITÉ : 
    1. Prévention des attaques par traversal de répertoire (Directory Traversal) en 
       ignorant les composantes "." et ".." qui pourraient permettre d'écrire en dehors 
       du dossier cible.
    2. Compatibilité Windows : suppression des espaces et points en fin de nom de fichier 
       (ex: "document.pdf "), qui sont invalides ou problématiques pour le système de fichiers NTFS.
    """
    parts = []
    for part in relative_path.replace("\\", "/").split("/"):
        part = part.strip().strip(".")
        if part in ("", ".", ".."):
            continue
        parts.append(part)
    return os.path.join(*parts) if parts else "fichier"


def extract_zip(appel_offres_id: int, zip_path: str) -> list[ExtractedFile]:
    """
    Dézippe le DCE d'un AppelOffres dans un dossier dédié et retourne la liste des
    fichiers utiles (les répertoires et fichiers parasites sont exclus).
    
    CHOIX DE SÉCURITÉ MAJEUR : On n'utilise PAS la méthode `zf.extractall()` car elle est 
    historiquement vulnérable aux attaques de traversal de chemin si le ZIP est malveillant. 
    L'extraction manuelle fichier par fichier, combinée à `_sanitize_for_filesystem`, 
    garantit un environnement d'exécution sécurisé et maîtrisé.
    """
    if not os.path.isfile(zip_path):
        raise ZipExtractionError(f"Fichier zip introuvable : {zip_path}")

    target_dir = os.path.join(settings.dce_extracted_storage_path, str(appel_offres_id))
    
    # Instrumentation : vérifier si le dossier existe déjà
    already_extracted = False
    existing_files_count = 0
    if os.path.exists(target_dir):
        already_extracted = True
        existing_files_count = len([f for f in os.listdir(target_dir) if os.path.isfile(os.path.join(target_dir, f))])
        logger.info(f"[PIPELINE] UNZIP .......... SKIP (dossier existe déjà, {existing_files_count} fichiers présents)")
        
        # Retourner les fichiers déjà extraits
        extracted: list[ExtractedFile] = []
        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if _is_junk(file):
                    continue
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, target_dir)
                filename_only = os.path.basename(file)
                extension = os.path.splitext(filename_only)[1].lstrip(".").lower()
                extracted.append(ExtractedFile(
                    absolute_path=full_path,
                    relative_path=relative_path,
                    nom_fichier=filename_only,
                    extension=extension,
                    taille_octets=os.path.getsize(full_path),
                ))
        logger.info(f"[PIPELINE] UNZIP .......... SKIP ({len(extracted)} fichiers retournés)")
        return extracted
    else:
        logger.info(f"[PIPELINE] UNZIP .......... RUN (dossier inexistant)")
    
    os.makedirs(target_dir, exist_ok=True)

    extracted: list[ExtractedFile] = []

    try:
        with zipfile.ZipFile(zip_path) as zf:
            # CONTRÔLE D'INTÉGRITÉ PROACTIF : `testzip()` parcourt l'archive pour vérifier 
            # la somme de contrôle (CRC) de chaque fichier. Cela permet d'échouer rapidement 
            # (fail-fast) sur un téléchargement incomplet ou corrompu, avant de tenter l'extraction.
            bad_file = zf.testzip()
            if bad_file is not None:
                raise ZipExtractionError(f"Membre corrompu dans le zip : {bad_file}")

            for info in zf.infolist():
                if info.is_dir():
                    continue

                # GESTION DE L'ENCODAGE : Vérification du drapeau UTF-8 (0x800) dans les métadonnées ZIP.
                # S'il est absent, on applique notre correctif heuristique pour les noms accentués.
                original_name = info.filename if (info.flag_bits & 0x800) else _fix_filename_encoding(info.filename)

                if _is_junk(original_name):
                    continue

                # Le chemin est assaini pour l'écriture sur disque, mais on garde l'original pour les métadonnées.
                safe_relative = _sanitize_for_filesystem(original_name)
                destination = os.path.join(target_dir, safe_relative)
                os.makedirs(os.path.dirname(destination), exist_ok=True)

                # Extraction manuelle sécurisée (évite les vulnérabilités de extractall)
                with zf.open(info) as source, open(destination, "wb") as out:
                    out.write(source.read())

                filename_only = os.path.basename(original_name.rstrip("/"))
                extension = os.path.splitext(filename_only)[1].lstrip(".").lower()

                extracted.append(ExtractedFile(
                    absolute_path=destination,
                    relative_path=safe_relative,
                    nom_fichier=filename_only,
                    extension=extension,
                    taille_octets=os.path.getsize(destination),
                ))
        logger.info(f"[PIPELINE] UNZIP .......... RUN ({len(extracted)} fichiers extraits)")
    except zipfile.BadZipFile as exc:
        raise ZipExtractionError(f"Zip illisible/corrompu : {exc}") from exc

    return extracted