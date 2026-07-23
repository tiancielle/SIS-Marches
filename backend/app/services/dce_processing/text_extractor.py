"""Extraction du texte brut d'un fichier selon son type.

Décision produit : on extrait toujours le document dans son intégralité (pas de
plafond de pages/taille) — la troncature n'intervient que plus tard, au niveau du
contexte envoyé au LLM (voir context_builder.py). Pour rester raisonnable en mémoire
sur les gros PDF, l'écriture du texte extrait se fait de façon incrémentale.
"""
import logging
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings
from app.services.dce_processing.zip_extractor import ExtractedFile

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "xlsx"}


def _check_pandoc() -> None:
    """Diagnostic explicite au démarrage : confirme si Python détecte bien Pandoc
    (via PATH, ou via pandoc_path si configuré), et log clairement le résultat —
    plutôt que de laisser échouer silencieusement à la première extraction .doc."""
    if settings.pandoc_path:
        os.environ["PYPANDOC_PANDOC"] = settings.pandoc_path
    try:
        import pypandoc
        version = pypandoc.get_pandoc_version()
        path = pypandoc.get_pandoc_path()
        logger.info(f"Pandoc détecté : version {version}, chemin '{path}'.")
    except OSError as exc:
        logger.warning(
            f"Pandoc non détecté par pypandoc ({exc}). Si Pandoc est installé mais "
            f"introuvable via PATH (fréquent sur Windows si le terminal n'a pas été "
            f"rouvert après l'installation), renseigne son chemin exact dans "
            f"PANDOC_PATH (.env) ou le paramètre pandoc_path. Note : même bien "
            f"détecté, Pandoc ne sait de toute façon pas lire nativement le binaire "
            f".doc (Word 97-2003) sans repli — voir _extract_doc."
        )


_check_pandoc()


def _find_libreoffice() -> Optional[str]:
    for name in ("soffice", "libreoffice"):
        path = shutil.which(name)
        if path:
            return path
    return None


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


def _extract_pdf(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """Tente pdfplumber d'abord (meilleure fidélité), replie sur pypdf en cas d'échec total."""
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
            return total_chars, None
        # texte vide -> probablement un PDF scanné (image) ; pas une erreur d'extraction
        return 0, None
    except Exception as pdfplumber_error:  # noqa: BLE001
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
            return total_chars, None
        except Exception as pypdf_error:  # noqa: BLE001
            return 0, f"pdfplumber: {pdfplumber_error} | pypdf (repli): {pypdf_error}"


def _extract_docx(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """Extraction des fichiers .docx (Word 2007+) via python-docx."""
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
        return total_chars, None
    except Exception as exc:  # noqa: BLE001
        return 0, str(exc)


def _convert_via_libreoffice(path: str) -> tuple[str, Optional[str]]:
    """Repli robuste pour le vrai binaire .doc Word 97-2003, que Pandoc ne sait pas
    lire nativement (confirmé : 'doc' n'apparaît pas dans la liste des formats
    d'entrée supportés par Pandoc). LibreOffice headless gère ce format correctement."""
    soffice = _find_libreoffice()
    if not soffice:
        return "", (
            "LibreOffice (soffice) introuvable sur cette machine. Installe LibreOffice "
            "pour permettre la conversion des .doc legacy, ou convertis ce fichier "
            "manuellement en .docx/.pdf."
        )
    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            subprocess.run(
                [soffice, "--headless", "--convert-to", "txt:Text", "--outdir", tmp_dir, path],
                timeout=60, capture_output=True, check=True,
            )
        except subprocess.TimeoutExpired:
            return "", "Conversion LibreOffice trop longue (timeout 60s)."
        except subprocess.CalledProcessError as exc:
            detail = exc.stderr.decode(errors="replace") if exc.stderr else str(exc)
            return "", f"Conversion LibreOffice échouée : {detail}"

        base_name = os.path.splitext(os.path.basename(path))[0]
        txt_path = os.path.join(tmp_dir, base_name + ".txt")
        if not os.path.isfile(txt_path):
            return "", "LibreOffice n'a produit aucun fichier texte en sortie pour ce document."
        with open(txt_path, "r", encoding="utf-8", errors="replace") as handle:
            return handle.read(), None


def _extract_doc(path: str, out_path: str) -> tuple[int, Optional[str], str]:
    """Ancien format binaire .doc (Word 97-2003).

    Pandoc ne sait PAS lire nativement ce format (vérifié : 'doc' est absent de
    la liste des formats d'entrée qu'il annonce lui-même supporter) — ce n'est
    donc pas (seulement) une question de détection/PATH. On tente quand même
    Pandoc en premier (gratuit, rapide, fonctionne sur de rares .doc au format
    RTF déguisé), puis on bascule sur LibreOffice headless, qui gère
    correctement le binaire legacy.
    """
    try:
        import pypandoc
        text = pypandoc.convert_file(path, "plain", format="doc")
        if text.strip():
            with open(out_path, "w", encoding="utf-8") as out:
                out.write(text)
            return len(text), None, "succes"
    except OSError as exc:
        logger.warning(f"Pandoc indisponible pour la conversion .doc ({exc}) — repli LibreOffice.")
    except RuntimeError:
        pass  # "Invalid input format" attendu pour un vrai binaire .doc — on tente le repli
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Échec Pandoc inattendu sur .doc ({exc}) — repli LibreOffice.")

    text, erreur = _convert_via_libreoffice(path)
    if erreur:
        return 0, f"Pandoc n'a pas pu lire ce .doc, et le repli LibreOffice a échoué : {erreur}", "non_supporte"
    if not text.strip():
        return 0, "Aucun texte extrait de ce .doc via LibreOffice (document peut-être vide ou scanné).", "non_supporte"

    with open(out_path, "w", encoding="utf-8") as out:
        out.write(text)
    return len(text), None, "succes"


def _extract_xlsx(path: str, out_path: str) -> tuple[int, Optional[str]]:
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
        return total_chars, None
    except Exception as exc:  # noqa: BLE001
        return 0, str(exc)


def extract_text(extracted_file: ExtractedFile, output_dir: str) -> ExtractionResult:
    extension = extracted_file.extension

    if extension not in SUPPORTED_EXTENSIONS:
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