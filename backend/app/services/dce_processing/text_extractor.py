"""Extraction du texte brut d'un fichier selon son type.

Décision produit : on extrait toujours le document dans son intégralité. 
Pour les .doc (Word 97-2003), la stratégie est :
1. LibreOffice (soffice) en priorité (recherche automatique des chemins d'installation).
2. Pandoc en solution de repli.
3. Dégradation gracieuse (non_supporte) si les deux échouent, sans faire planter le pipeline.
"""
import os
import subprocess
import shutil
import tempfile
import logging
from dataclasses import dataclass
from typing import Optional

from app.services.dce_processing.zip_extractor import ExtractedFile

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "xlsx"}


@dataclass
class ExtractionResult:
    texte_extrait_path: Optional[str]
    nb_caracteres: int
    statut: str          # succes | echec | non_supporte
    erreur: Optional[str]


def _output_txt_path(extracted_file: ExtractedFile, output_dir: str) -> str:
    base, _ = os.path.splitext(extracted_file.relative_path)
    txt_relative = base + ".txt"
    destination = os.path.join(output_dir, txt_relative)
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    return destination


def _find_libreoffice_executable() -> Optional[str]:
    """Recherche l'exécutable LibreOffice (soffice) sur la machine."""
    logger.debug("[DIAG] Recherche de LibreOffice (soffice)...")
    
    # 1. Chemins d'installation par défaut sous Windows
    win_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for path in win_paths:
        if os.path.exists(path):
            logger.info(f"[DIAG] Succès : LibreOffice trouvé à l'emplacement par défaut : {path}")
            return path
    
    # 2. Fallback : vérifier s'il est dans le PATH système (Linux/macOS ou install custom Windows)
    logger.debug("[DIAG] Non trouvé dans les chemins Windows par défaut. Vérification du PATH système...")
    for cmd in ["soffice", "soffice.exe"]:
        try:
            result = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                logger.info(f"[DIAG] Succès : LibreOffice trouvé dans le PATH système : {cmd}")
                return cmd
        except FileNotFoundError:
            continue
        except Exception as e:
            logger.debug(f"[DIAG] Erreur lors de la vérification de {cmd} dans le PATH : {e}")
    
    logger.warning("[DIAG] Échec : LibreOffice (soffice) introuvable sur cette machine.")
    return None


def _extract_pdf(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """Tente pdfplumber d'abord (meilleure fidélité), replie sur pypdf en cas d'échec total."""
    logger.debug(f"[DIAG] Extraction PDF démarrée pour : {os.path.basename(path)}")
    total_chars = 0
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf, open(out_path, "w", encoding="utf-8") as out:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text:
                    out.write(page_text)
                    out.write("\n\n")
                    total_chars += len(page_text)
        if total_chars > 0:
            logger.info(f"[DIAG] Succès extraction PDF (pdfplumber) : {total_chars} caractères.")
            return total_chars, None
        
        logger.warning("[DIAG] PDF vide : probablement un PDF scanné (image).")
        return 0, None
    except Exception as pdfplumber_error:
        logger.debug(f"[DIAG] Échec pdfplumber, tentative de repli pypdf. Erreur: {pdfplumber_error}")
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            total_chars = 0
            with open(out_path, "w", encoding="utf-8") as out:
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    if page_text:
                        out.write(page_text)
                        out.write("\n\n")
                        total_chars += len(page_text)
            logger.info(f"[DIAG] Succès extraction PDF (pypdf repli) : {total_chars} caractères.")
            return total_chars, None
        except Exception as pypdf_error:
            logger.error(f"[DIAG] Échec total extraction PDF. pypdf erreur: {pypdf_error}")
            return 0, f"pdfplumber: {pdfplumber_error} | pypdf (repli): {pypdf_error}"


def _extract_docx(path: str, out_path: str) -> tuple[int, Optional[str]]:
    logger.debug(f"[DIAG] Extraction DOCX démarrée pour : {os.path.basename(path)}")
    try:
        import docx
        document = docx.Document(path)
        total_chars = 0
        with open(out_path, "w", encoding="utf-8") as out:
            for paragraph in document.paragraphs:
                if paragraph.text:
                    out.write(paragraph.text)
                    out.write("\n")
                    total_chars += len(paragraph.text)
            for table in document.tables:
                for row in table.rows:
                    cells_text = "\t".join(cell.text for cell in row.cells if cell.text)
                    if cells_text:
                        out.write(cells_text)
                        out.write("\n")
                        total_chars += len(cells_text)
        logger.info(f"[DIAG] Succès extraction DOCX : {total_chars} caractères.")
        return total_chars, None
    except Exception as exc:
        logger.error(f"[DIAG] Échec extraction DOCX : {exc}")
        return 0, str(exc)


def _extract_doc(path: str, out_path: str) -> tuple[int, Optional[str], str]:
    """
    Extraction des fichiers .doc (Word 97-2003).
    Stratégie : 1. LibreOffice (recherche auto des chemins) -> 2. Pandoc (repli) -> 3. non_supporte.
    """
    filename = os.path.basename(path)
    logger.info(f"[DIAG] === DÉBUT TRAITEMENT .DOC : {filename} ===")
    
    # --- ÉTAPE 1 : LibreOffice (Méthode principale) ---
    lo_path = _find_libreoffice_executable()
    if lo_path:
        logger.info(f"[DIAG] Tentative de conversion via LibreOffice : {filename}")
        temp_dir = os.path.dirname(out_path)
        base_name = os.path.splitext(filename)[0]
        # LibreOffice va créer un fichier nommé base_name.txt dans temp_dir
        temp_txt_path = os.path.join(temp_dir, f"{base_name}.txt")

        cmd = [
            lo_path,
            "--headless",
            "--convert-to", "txt:Text (encoded):UTF8",
            "--outdir", temp_dir,
            path
        ]

        try:
            logger.debug(f"[DIAG] Exécution commande LO : {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

            # Important : LibreOffice peut renvoyer un code de sortie non-nul même
            # quand la conversion a réellement réussi (confirmé en test manuel :
            # ExitCode=1 mais fichier produit avec ~48000 caractères cohérents). On
            # se fie donc uniquement à la présence et au contenu réel du fichier
            # produit, jamais au code de retour seul.
            if os.path.exists(temp_txt_path):
                # On déplace/renomme le fichier généré vers le out_path final attendu par le pipeline
                if temp_txt_path != out_path:
                    os.replace(temp_txt_path, out_path)

                with open(out_path, "r", encoding="utf-8") as f:
                    text = f.read()

                if text.strip():
                    if result.returncode != 0:
                        logger.info(
                            f"[DIAG] LibreOffice a renvoyé le code {result.returncode} mais le "
                            f"fichier produit est bien exploitable ({len(text)} caractères) — "
                            f"traité comme un succès (code de retour non fiable, connu chez LibreOffice)."
                        )
                    logger.info(f"[DIAG] SUCCÈS LibreOffice : {len(text)} caractères extraits de {filename}.")
                    return len(text), None, "succes"
                logger.warning(f"[DIAG] Fichier produit par LibreOffice mais vide pour {filename}.")
            else:
                logger.warning(f"[DIAG] Échec conversion LibreOffice. Code retour: {result.returncode}. stderr: {result.stderr}")
        except subprocess.TimeoutExpired:
            logger.warning(f"[DIAG] Timeout (120s) lors de la conversion LibreOffice pour {filename}.")
        except Exception as e:
            logger.warning(f"[DIAG] Exception ({type(e).__name__}) lors de l'exécution LibreOffice pour {filename} : {e}")

    # --- ÉTAPE 2 : Pandoc (Solution de repli) ---
    logger.info(f"[DIAG] LibreOffice a échoué ou est absent. Tentative de repli via Pandoc pour : {filename}")
    try:
        import pypandoc
        # On force explicitement le format d'entrée 'doc'
        text = pypandoc.convert_file(path, "plain", format="doc")
        with open(out_path, "w", encoding="utf-8") as out:
            out.write(text)
        logger.info(f"[DIAG] SUCCÈS Pandoc (repli) : {len(text)} caractères extraits de {filename}.")
        return len(text), None, "succes"
    except (RuntimeError, OSError) as e:
        logger.warning(f"[DIAG] Échec du repli Pandoc pour {filename} : {e}")
    except Exception as e:
        logger.warning(f"[DIAG] Exception inattendue lors du repli Pandoc pour {filename} : {e}")

    # --- ÉTAPE 3 : Dégradation gracieuse ---
    error_msg = (
        "Pandoc n'a pas pu lire ce .doc, et le repli LibreOffice a échoué ou est introuvable. "
        "Installe LibreOffice pour permettre la conversion des .doc legacy, ou convertis ce fichier manuellement en .docx/.pdf."
    )
    logger.error(f"[DIAG] ÉCHEC TOTAL pour {filename}. Le fichier sera marqué comme 'non_supporte' dans le pipeline.")
    return 0, error_msg, "non_supporte"


def _extract_xlsx(path: str, out_path: str) -> tuple[int, Optional[str]]:
    logger.debug(f"[DIAG] Extraction XLSX démarrée pour : {os.path.basename(path)}")
    try:
        import openpyxl
        workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
        total_chars = 0
        with open(out_path, "w", encoding="utf-8") as out:
            for sheet in workbook.worksheets:
                out.write(f"--- Feuille: {sheet.title} ---\n")
                for row in sheet.iter_rows():
                    values = [str(cell.value) for cell in row if cell.value is not None]
                    if values:
                        line = "\t".join(values)
                        out.write(line)
                        out.write("\n")
                        total_chars += len(line)
        logger.info(f"[DIAG] Succès extraction XLSX : {total_chars} caractères.")
        return total_chars, None
    except Exception as exc:
        logger.error(f"[DIAG] Échec extraction XLSX : {exc}")
        return 0, str(exc)


def extract_text(extracted_file: ExtractedFile, output_dir: str) -> ExtractionResult:
    extension = extracted_file.extension
    logger.info(f"[DIAG] Pipeline d'extraction appelé pour : {extracted_file.relative_path} (type: {extension})")

    if extension not in SUPPORTED_EXTENSIONS:
        logger.warning(f"[DIAG] Type non supporté : .{extension}")
        return ExtractionResult(
            texte_extrait_path=None,
            nb_caracteres=0,
            statut="non_supporte",
            erreur=f"Type de fichier '.{extension or '?'}' non pris en charge pour l'extraction de texte.",
        )

    out_path = _output_txt_path(extracted_file, output_dir)

    if extension == "pdf":
        nb_chars, erreur = _extract_pdf(extracted_file.absolute_path, out_path)
        if erreur:
            return ExtractionResult(None, 0, "echec", erreur)
        if nb_chars == 0:
            return ExtractionResult(
                out_path, 0, "non_supporte",
                "Aucun texte extrait — probablement un PDF scanné (image). OCR hors périmètre de cette session.",
            )
        return ExtractionResult(out_path, nb_chars, "succes", None)

    if extension == "docx":
        nb_chars, erreur = _extract_docx(extracted_file.absolute_path, out_path)
        if erreur:
            return ExtractionResult(None, 0, "echec", erreur)
        return ExtractionResult(out_path, nb_chars, "succes", None)

    if extension == "doc":
        nb_chars, erreur, statut = _extract_doc(extracted_file.absolute_path, out_path)
        return ExtractionResult(out_path if statut == "succes" else None, nb_chars, statut, erreur)

    if extension == "xlsx":
        nb_chars, erreur = _extract_xlsx(extracted_file.absolute_path, out_path)
        if erreur:
            return ExtractionResult(None, 0, "echec", erreur)
        return ExtractionResult(out_path, nb_chars, "succes", None)

    return ExtractionResult(None, 0, "non_supporte", "Type de fichier non géré.")