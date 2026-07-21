"""Dézippage d'un DCE téléchargé : liste chaque fichier utile avec ses métadonnées.

Les zips réels observés sur le portail contiennent :
- des noms de fichiers accentués, avec espaces en fin de nom de dossier ("AO SP4130189 ")
- parfois un encodage CP437 mal interprété (mojibake) plutôt que de l'UTF-8 déclaré
- des fichiers parasites (verrous Office ~$..., ~WRL*.tmp, Thumbs.db, .DS_Store, __MACOSX/)
  qui n'ont aucune valeur informative et doivent être ignorés silencieusement.
"""
import os
import zipfile
from dataclasses import dataclass

from app.core.config import settings

# Préfixes/suffixes de fichiers parasites à ignorer systématiquement
_JUNK_PATTERNS = ("~$", "~wrl", "thumbs.db", ".ds_store", "desktop.ini")
_JUNK_DIR_MARKERS = ("__macosx",)


@dataclass
class ExtractedFile:
    absolute_path: str
    relative_path: str      # chemin relatif tel qu'il apparaissait dans le zip (sous-dossiers conservés)
    nom_fichier: str        # nom de fichier seul, original (accents/espaces conservés)
    extension: str          # sans le point, en minuscule ("pdf", "docx", ...)
    taille_octets: int


class ZipExtractionError(Exception):
    """Le zip lui-même est illisible/corrompu — rien n'a pu être extrait."""


def _fix_filename_encoding(raw_name: str) -> str:
    """zipfile décode par défaut en CP437 quand le flag UTF-8 n'est pas posé, ce qui
    donne du mojibake sur les noms accentués produits par des outils Windows/PHP côté
    portail. On retente un ré-encodage en CP437 -> décodage UTF-8, qui corrige le cas
    le plus fréquent ; si ça échoue, on garde le nom tel quel plutôt que de planter."""
    try:
        return raw_name.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return raw_name


def _is_junk(relative_path: str) -> bool:
    lowered = relative_path.lower()
    if any(marker in lowered for marker in _JUNK_DIR_MARKERS):
        return True
    filename = os.path.basename(lowered)
    return any(filename.startswith(p) or filename == p for p in _JUNK_PATTERNS if not p.startswith("."))\
        or any(filename == p or filename.endswith(p) for p in _JUNK_PATTERNS if p.startswith("."))


def _sanitize_for_filesystem(relative_path: str) -> str:
    """Nettoie un chemin pour qu'il soit sûr à écrire sur disque, sans changer le nom
    affiché à l'utilisateur (conservé séparément en base)."""
    parts = []
    for part in relative_path.replace("\\", "/").split("/"):
        part = part.strip().strip(".")
        if part in ("", ".", ".."):
            continue
        parts.append(part)
    return os.path.join(*parts) if parts else "fichier"


def extract_zip(appel_offres_id: int, zip_path: str) -> list[ExtractedFile]:
    """Dézippe le DCE d'un AppelOffres dans un dossier dédié et retourne la liste des
    fichiers utiles (les répertoires et fichiers parasites sont exclus)."""
    if not os.path.isfile(zip_path):
        raise ZipExtractionError(f"Fichier zip introuvable : {zip_path}")

    target_dir = os.path.join(settings.dce_extracted_storage_path, str(appel_offres_id))
    os.makedirs(target_dir, exist_ok=True)

    extracted: list[ExtractedFile] = []

    try:
        with zipfile.ZipFile(zip_path) as zf:
            bad_file = zf.testzip()
            if bad_file is not None:
                raise ZipExtractionError(f"Membre corrompu dans le zip : {bad_file}")

            for info in zf.infolist():
                if info.is_dir():
                    continue

                # flag_bits & 0x800 == UTF-8 déclaré explicitement dans le zip
                original_name = info.filename if (info.flag_bits & 0x800) else _fix_filename_encoding(info.filename)

                if _is_junk(original_name):
                    continue

                safe_relative = _sanitize_for_filesystem(original_name)
                destination = os.path.join(target_dir, safe_relative)
                os.makedirs(os.path.dirname(destination), exist_ok=True)

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
    except zipfile.BadZipFile as exc:
        raise ZipExtractionError(f"Zip illisible/corrompu : {exc}") from exc

    return extracted
