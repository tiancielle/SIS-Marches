"""Extraction du texte brut d'un fichier selon son type.

Décision produit : on extrait toujours le document dans son intégralité (pas de
plafond de pages/taille) — la troncature n'intervient que plus tard, au niveau du
contexte envoyé au LLM (voir context_builder.py). Pour rester raisonnable en mémoire
sur les gros PDF (un cas à 76 Mo a été observé en test), l'écriture du texte extrait
se fait de façon incrémentale, page par page / feuille par feuille, directement sur
disque, plutôt que d'accumuler une immense chaîne en mémoire avant de l'écrire.
"""
import os
from dataclasses import dataclass
from typing import Optional

from app.services.dce_processing.zip_extractor import ExtractedFile

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
    except Exception as pdfplumber_error:  # noqa: BLE001 — on veut absolument retenter avant d'abandonner
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


def _extract_doc(path: str, out_path: str) -> tuple[int, Optional[str], str]:
    """Ancien format binaire .doc — nécessite Pandoc installé sur la machine (statut
    inconnu, à vérifier). En son absence ou en cas d'échec, on dégrade proprement en
    'non_supporte' plutôt que de faire planter le pipeline."""
    try:
        import pypandoc
        text = pypandoc.convert_file(path, "plain")
        with open(out_path, "w", encoding="utf-8") as out:
            out.write(text)
        return len(text), None, "succes"
    except OSError as exc:
        return 0, f"Pandoc non disponible sur cette machine : {exc}", "non_supporte"
    except Exception as exc:  # noqa: BLE001
        return 0, f"Conversion Pandoc échouée : {exc}", "non_supporte"


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

    # Ne devrait jamais arriver vu le filtre SUPPORTED_EXTENSIONS ci-dessus
    return ExtractionResult(None, 0, "non_supporte", "Type de fichier non géré.")
