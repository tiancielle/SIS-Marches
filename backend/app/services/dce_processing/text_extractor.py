"""
Extraction du texte brut d'un fichier selon son type.

Décision produit : on extrait toujours le document dans son intégralité. 
Pour les .doc (Word 97-2003), la stratégie est :
1. LibreOffice (soffice) en priorité (recherche automatique des chemins d'installation).
2. Pandoc en solution de repli.
3. Dégradation gracieuse (non_supporte) si les deux échouent, sans faire planter le pipeline.

Justification architecturale : Ce module est conçu pour la robustesse en environnement de production.
Il privilégie la dégradation gracieuse (graceful degradation) et les mécanismes de repli (fallback) 
pour garantir qu'un seul fichier corrompu ou mal formaté n'interrompe pas l'ingestion globale du pipeline.
"""
import os

# CONTRAINTE DE PERFORMANCE BACKEND : Les bibliothèques sous-jacentes (comme OpenCV via PaddleOCR 
# ou NumPy) tentent par défaut d'utiliser tous les cœurs CPU disponibles. Dans un serveur web 
# asynchrone (FastAPI), cela provoque une contention de threads et peut faire planter le serveur 
# lors de requêtes concurrentes. On limite volontairement à 4 threads pour un usage prévisible des ressources.
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")

import subprocess
import shutil
import tempfile
import logging
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings
from app.services.dce_processing.zip_extractor import ExtractedFile

logger = logging.getLogger(__name__)

# OPTIMISATION MÉMOIRE/TEMPS : Le chargement des modèles PaddleOCR en RAM/VRAM est une opération 
# très coûteuse (plusieurs secondes et téléchargement de poids au premier appel). 
# Ce dictionnaire agit comme un cache au niveau du module (singleton) pour ne payer ce coût 
# qu'une seule fois par langue au cours de la vie du processus, et non à chaque document.
_paddle_ocr_instances: dict[str, object] = {}


def _get_paddle_ocr(lang: str):
    """Récupère ou initialise l'instance PaddleOCR pour une langue donnée."""
    if lang not in _paddle_ocr_instances:
        logger.info(f"[DIAG] Chargement de PaddleOCR (lang={lang})...")
        from paddleocr import PaddleOCR
        
        # CHOIX DE CONFIGURATION OCR : 
        # On désactive les étapes de prétraitement lourdes (classification d'orientation, 
        # redressement de document, orientation des lignes). Pour des documents administratifs 
        # (DCE) numérisés, ceux-ci sont généralement droits et bien formatés. 
        # Désactiver ces options réduit drastiquement le temps d'inférence sans perte de précision.
        # enable_mkldnn=False est choisi pour éviter des segfaults ou fuites mémoire connus 
        # dans certains environnements conteneurisés ou architectures CPU spécifiques.
        _paddle_ocr_instances[lang] = PaddleOCR(
            lang=lang,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
        )
        logger.info(f"[DIAG] PaddleOCR (lang={lang}) chargé avec succès.")
    return _paddle_ocr_instances[lang]


def _extract_ocr_result_texts(result_item) -> list:
    """
    Extrait les textes reconnus d'un résultat PaddleOCR.
    Justification : L'API Python de PaddleOCR a évolué entre les versions majeures (2.x vs 3.x). 
    Cette fonction de compatibilité défensive essaie d'abord l'accès par dictionnaire, puis par attribut, 
    garantissant que le pipeline ne casse pas lors d'une mise à jour de la dépendance.
    """
    try:
        return list(result_item["rec_texts"])
    except (KeyError, TypeError, IndexError):
        pass
    texts = getattr(result_item, "rec_texts", None)
    return list(texts) if texts else []


def _ocr_page_avec_langue(img_path: str, lang: str) -> str:
    """Exécute l'OCR sur une image pour une langue spécifique."""
    try:
        ocr = _get_paddle_ocr(lang)
        result = ocr.predict(img_path)

        # DIAGNOSTIC 2 : Résultats bruts PaddleOCR
        logger.info(f"[DIAG-OCR] Image: {os.path.basename(img_path)}, Langue: {lang}")
        logger.info(f"[DIAG-OCR] Nombre de résultats: {len(result)}")

        if len(result) > 0:
            first_item = result[0]
            # Tenter d'accéder aux métadonnées de confiance si disponibles
            if isinstance(first_item, dict):
                logger.info(f"[DIAG-OCR] Clés disponibles: {list(first_item.keys())}")
                if "rec_scores" in first_item:
                    scores = first_item["rec_scores"]
                    if scores:
                        avg_confidence = sum(scores) / len(scores)
                        logger.info(f"[DIAG-OCR] Confiance moyenne: {avg_confidence:.2f}")
                        logger.info(f"[DIAG-OCR] Scores: {scores[:5]}...")  # Premiers 5 scores

        texts = []
        for item in result:
            extracted = _extract_ocr_result_texts(item)
            texts.extend(extracted)

        logger.info(f"[DIAG-OCR] Texte extrait: {len(texts)} blocs, {len(' '.join(texts))} caractères")
        if texts:
            logger.info(f"[DIAG-OCR] Aperçu texte: {' '.join(texts[:2])}...")  # Premiers 2 blocs

        return "\n".join(texts)
    except Exception as exc:  # noqa: BLE001
        # GESTION D'ERREUR : Dans un traitement par lots, une image corrompue ne doit pas 
        # faire échouer l'ensemble du document. On logue l'erreur et on retourne une chaîne vide 
        # pour permettre à la logique de repli (langue suivante) de s'exécuter.
        logger.warning(f"[DIAG] Échec OCR (lang={lang}) sur {img_path} : {exc}")
        return ""


def _ocr_pdf_scanne(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """
    Repli OCR pour un PDF scanné.

    STRATÉGIE D'OPTIMISATION (GELÉE EN ATTENTE DE VALIDATION) :
    Les DCE marocains sont presque toujours mono-langue par document. Tester systématiquement
    toutes les langues configurées sur chaque page entraîne une complexité O(N * M).
    Cette fonction détecte la langue dominante sur la première page, puis la priorise pour les
    pages suivantes, ramenant la complexité effective proche de O(N + M). Un filet de sécurité
    conserve la possibilité de tester les autres langues si le résultat est en dessous d'un
    seuil de confiance heuristique (SEUIL_SUFFISANT).
    """
    try:
        # CHOIX TECHNIQUE : PyMuPDF (fitz) est utilisé car c'est la bibliothèque la plus rapide
        # et la plus fiable pour le rendu de pages PDF en images (pixmaps) en Python.
        import fitz  # PyMuPDF
    except ImportError as exc:
        return 0, f"PyMuPDF (fitz) non installé : {exc}"

    langues = settings.ocr_langs.split(",") if settings.ocr_langs else ["fr"]
    langues = [l.strip() for l in langues if l.strip()]

    # HEURISTIQUE : Un seuil de 30 caractères permet d'éviter les "faux positifs" (bruit de fond
    # ou artefacts de scan reconnus comme 2-3 lettres). 30 caractères indiquent généralement
    # qu'une ligne ou un paragraphe significatif a été lu avec succès, justifiant l'arrêt des tests.
    SEUIL_SUFFISANT = 30  # nb de caractères au-delà duquel une page est considérée bien reconnue

    total_chars = 0
    langue_dominante: Optional[str] = None

    # DIAGNOSTIC 1 : Répertoire pour sauvegarder les images pour inspection
    debug_img_dir = os.path.join(settings.dce_extracted_storage_path, "debug_ocr_images")
    os.makedirs(debug_img_dir, exist_ok=True)
    pdf_name = os.path.splitext(os.path.basename(path))[0]
    debug_pdf_dir = os.path.join(debug_img_dir, pdf_name)
    os.makedirs(debug_pdf_dir, exist_ok=True)
    logger.info(f"[DIAG-DEBUG] Images OCR sauvegardées dans: {debug_pdf_dir}")

    try:
        doc = fitz.open(path)
        nb_pages = len(doc)

        # DIAGNOSTIC 1 : Informations sur le PDF source
        logger.info(f"[DIAG-PDF] Fichier: {os.path.basename(path)}")
        logger.info(f"[DIAG-PDF] Nombre de pages: {nb_pages}")
        logger.info(f"[DIAG-PDF] Taille: {os.path.getsize(path) / 1024:.1f} KB")

        with tempfile.TemporaryDirectory() as tmp_dir, open(out_path, "w", encoding="utf-8") as out:
            for page_num, page in enumerate(doc, start=1):
                # CHOIX DE RÉSOLUTION : 200 DPI est le "sweet spot" pour l'OCR.
                # 72/96 DPI est trop faible pour une reconnaissance précise des caractères,
                # tandis que 300+ DPI ralentit considérablement le rendu et consomme trop de RAM
                # pour un gain de précision marginal sur du texte administratif standard.
                pix = page.get_pixmap(dpi=200)
                page_img_path = os.path.join(tmp_dir, f"page_{page_num}.png")
                pix.save(page_img_path)

                # DIAGNOSTIC 1 : Sauvegarder une copie pour inspection humaine
                debug_img_path = os.path.join(debug_pdf_dir, f"page_{page_num}_dpi200.png")
                pix.save(debug_img_path)

                # DIAGNOSTIC 1 : Qualité de l'image générée
                img_size = os.path.getsize(page_img_path)
                img_dims = (pix.width, pix.height)
                logger.info(f"[DIAG-IMG] Page {page_num}: {img_dims[0]}x{img_dims[1]} px, {img_size / 1024:.1f} KB, DPI: 200")
                logger.info(f"[DIAG-IMG] Image temporaire: {page_img_path}")
                logger.info(f"[DIAG-IMG] Image debug: {debug_img_path}")

                # DIAGNOSTIC 3 : Suivi bilingue détaillé
                logger.info(f"[DIAG-BILINGUE] === Page {page_num}/{nb_pages} ===")
                logger.info(f"[DIAG-BILINGUE] Langue dominante actuelle: {langue_dominante or 'Non détectée'}")

                # Ordre de langues à tester pour cette page : la langue dominante
                # détectée en premier si on la connaît déjà, sinon l'ordre par défaut.
                if langue_dominante:
                    ordre = [langue_dominante] + [l for l in langues if l != langue_dominante]
                else:
                    ordre = langues

                logger.info(f"[DIAG-BILINGUE] Ordre des langues à tester: {ordre}")

                meilleur_texte = ""
                meilleure_langue = None
                for lang in ordre:
                    logger.info(f"[DIAG-BILINGUE] → Test langue: {lang}")
                    texte = _ocr_page_avec_langue(page_img_path, lang)
                    logger.info(f"[DIAG-BILINGUE] ← Résultat {lang}: {len(texte)} caractères")

                    if len(texte) > len(meilleur_texte):
                        meilleur_texte = texte
                        meilleure_langue = lang
                    if len(meilleur_texte) >= SEUIL_SUFFISANT:
                        logger.info(f"[DIAG-BILINGUE] Seuil {SEUIL_SUFFISANT} atteint, arrêt des tests")
                        break  # résultat déjà exploitable, pas besoin de tester les autres langues

                # Dès la première page qui donne un résultat exploitable, on fige la
                # langue dominante pour accélérer toutes les pages suivantes.
                if langue_dominante is None and meilleure_langue and len(meilleur_texte) >= SEUIL_SUFFISANT:
                    langue_dominante = meilleure_langue
                    logger.info(f"[DIAG-BILINGUE] Langue dominante FIGÉE: {langue_dominante} (dès la page {page_num})")

                logger.info(f"[DIAG-BILINGUE] Meilleur résultat page {page_num}: {meilleure_langue} ({len(meilleur_texte)} caractères)")

                if meilleur_texte:
                    out.write(meilleur_texte)
                    out.write("\n\n")
                    total_chars += len(meilleur_texte)

                    # DIAGNOSTIC 4 : Vérification texte écrit
                    logger.info(f"[DIAG-ECRITURE] Page {page_num}: {len(meilleur_texte)} caractères écrits dans fichier")
                else:
                    logger.warning(f"[DIAG-ECRITURE] Page {page_num}: AUCUN texte extrait!")

        doc.close()
    except Exception as exc:  # noqa: BLE001
        return 0, f"Erreur pendant l'OCR : {exc}"

    if total_chars > 0:
        logger.info(f"[DIAG] Succès OCR (PaddleOCR, {'/'.join(langues)}) : {total_chars} caractères extraits de {nb_pages} page(s).")
    return total_chars, None


SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "xlsx"}


@dataclass
class ExtractionResult:
    texte_extrait_path: Optional[str]
    nb_caracteres: int
    statut: str          # succes | echec | non_supporte
    erreur: Optional[str]


def _output_txt_path(extracted_file: ExtractedFile, output_dir: str) -> str:
    """Calcule le chemin de sortie du fichier texte en préservant la structure relative des dossiers."""
    base, _ = os.path.splitext(extracted_file.relative_path)
    txt_relative = base + ".txt"
    destination = os.path.join(output_dir, txt_relative)
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    return destination


def _find_libreoffice_executable() -> Optional[str]:
    """
    Recherche l'exécutable LibreOffice (soffice) sur la machine.
    Justification : S'appuyer uniquement sur le PATH système est fragile en production 
    (surtout sous Windows avec les services ou les environnements virtuels). 
    On implémente donc une cascade de recherche : config explicite > chemins par défaut > PATH.
    """
    logger.debug("[DIAG] Recherche de LibreOffice (soffice)...")

    # 0. Chemin explicite fourni en config — prioritaire, aucune détection nécessaire.
    # Utile si l'install est à un emplacement non standard, ou pour contourner
    # définitivement un souci de détection PATH intermittent.
    if settings.libreoffice_path:
        if os.path.exists(settings.libreoffice_path):
            logger.info(f"[DIAG] Succès : LibreOffice via LIBREOFFICE_PATH (.env) : {settings.libreoffice_path}")
            return settings.libreoffice_path
        logger.warning(
            f"[DIAG] LIBREOFFICE_PATH configuré ('{settings.libreoffice_path}') mais introuvable à cet "
            f"emplacement — poursuite avec la détection automatique."
        )

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
    # CHOIX DE TIMEOUT : Un premier lancement "à froid" de LibreOffice sur Windows peut légitimement 
    # dépasser 5s (initialisation du profil utilisateur, analyse par l'antivirus/Windows Defender). 
    # Un timeout de 5s provoquait des échecs de détection intermittents (faux négatifs). 20s est un 
    # compromis sûr pour la détection sans bloquer indéfiniment le thread.
    logger.debug("[DIAG] Non trouvé dans les chemins Windows par défaut. Vérification du PATH système...")
    for cmd in ["soffice", "soffice.exe"]:
        try:
            result = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=20)
            if result.returncode == 0:
                logger.info(f"[DIAG] Succès : LibreOffice trouvé dans le PATH système : {cmd}")
                return cmd
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            logger.warning(f"[DIAG] Détection de '{cmd}' expirée après 20s (démarrage à froid ?). Essai suivant.")
        except Exception as e:
            logger.debug(f"[DIAG] Erreur lors de la vérification de {cmd} dans le PATH : {e}")

    logger.warning(
        "[DIAG] Échec : LibreOffice (soffice) introuvable sur cette machine. Si LibreOffice est bien "
        "installé, renseigne LIBREOFFICE_PATH dans .env avec le chemin exact vers soffice.exe pour "
        "contourner la détection."
    )
    return None


def _extract_pdf(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """
    Tente l'extraction native du PDF.
    Stratégie : pdfplumber en priorité (meilleure fidélité de mise en page et gestion des tableaux), 
    avec un repli sur pypdf en cas d'échec total (plus tolérant aux PDFs malformés).
    """
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
    """Extraction native des fichiers Word modernes (.docx) via python-docx."""
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
            # Les tableaux sont souvent porteurs d'informations critiques dans les DCE.
            # On les extrait en format texte tabulé pour préserver une structure lisible.
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
    Extraction des fichiers .doc (Word 97-2003, format binaire legacy).
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
            # Timeout de 120s : la conversion de gros documents legacy peut être lente.
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

            # CONTournement DE BUG CONNU : LibreOffice CLI renvoie souvent un code de sortie 
            # non-nul (ex: 1) même quand la conversion a réussi. Se fier au returncode seul 
            # générerait des faux échecs. La seule métrique fiable est l'existence du fichier 
            # de sortie et sa taille (nombre de caractères).
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
        # On force explicitement le format d'entrée 'doc' pour éviter que Pandoc ne devine mal le format.
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
    # PLANNING PIPELINE : Plutôt que de lever une exception qui arrêterait le traitement par lots, 
    # on retourne un statut "non_supporte". Cela permet au système d'ingestion de marquer le fichier 
    # pour une révision manuelle ultérieure tout en continuant à traiter les fichiers suivants.
    error_msg = (
        "Pandoc n'a pas pu lire ce .doc, et le repli LibreOffice a échoué ou est introuvable. "
        "Installe LibreOffice pour permettre la conversion des .doc legacy, ou convertis ce fichier manuellement en .docx/.pdf."
    )
    logger.error(f"[DIAG] ÉCHEC TOTAL pour {filename}. Le fichier sera marqué comme 'non_supporte' dans le pipeline.")
    return 0, error_msg, "non_supporte"


def _extract_xlsx(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """Extraction des fichiers Excel en préservant la structure par feuille et par ligne."""
    logger.debug(f"[DIAG] Extraction XLSX démarrée pour : {os.path.basename(path)}")
    try:
        import openpyxl
        # OPTIMISATION MÉMOIRE ET SÉMANTIQUE : 
        # data_only=True : Extrait les valeurs calculées plutôt que les formules Excel (inutiles pour le NLP).
        # read_only=True : Active le mode de lecture en flux (streaming), empêchant les pics de consommation 
        # RAM massifs lors de l'ouverture de fichiers Excel volumineux.
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
    """
    Point d'entrée principal du pipeline d'extraction.
    Agit comme un routeur qui dispatche vers la méthode adaptée selon l'extension,
    et gère la logique spécifique de repli OCR uniquement pour les PDFs.
    """
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

        # LOGIQUE DE BASCULE OCR : Si l'extraction native ne renvoie aucun caractère,
        # on en déduit que le PDF est probablement une image scannée. On déclenche alors
        # le pipeline OCR coûteux uniquement si nécessaire, optimisant ainsi les ressources globales.
        if nb_chars == 0:
            logger.info(f"[DIAG] Aucun texte natif — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
            nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
            if erreur_ocr:
                return ExtractionResult(
                    out_path, 0, "non_supporte",
                    f"Aucun texte natif, et l'OCR a échoué : {erreur_ocr}",
                )
            if nb_chars_ocr == 0:
                return ExtractionResult(
                    out_path, 0, "non_supporte",
                    "Aucun texte extrait, même après OCR (image illisible, page blanche, ou qualité de scan trop faible).",
                )

            # DIAGNOSTIC 4 & 5 : Vérification texte final envoyé au LLM
            logger.info(f"[DIAG-FINAL] === VERIFICATION TEXTE FINAL ===")
            logger.info(f"[DIAG-FINAL] Fichier: {out_path}")
            logger.info(f"[DIAG-FINAL] Caractères totaux: {nb_chars_ocr}")

            try:
                with open(out_path, "r", encoding="utf-8") as f:
                    final_text = f.read()
                    lines = final_text.split("\n")
                    logger.info(f"[DIAG-FINAL] Nombre de lignes: {len(lines)}")
                    logger.info(f"[DIAG-FINAL] Aperçu (500 premiers caractères): {final_text[:500]}")

                    # Calculer la densité de texte (caractères par ligne moyenne)
                    non_empty_lines = [l for l in lines if l.strip()]
                    if non_empty_lines:
                        avg_line_length = sum(len(l) for l in non_empty_lines) / len(non_empty_lines)
                        logger.info(f"[DIAG-FINAL] Longueur moyenne ligne: {avg_line_length:.1f} caractères")
            except Exception as e:
                logger.error(f"[DIAG-FINAL] Erreur lecture fichier final: {e}")

            return ExtractionResult(out_path, nb_chars_ocr, "succes", None)
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