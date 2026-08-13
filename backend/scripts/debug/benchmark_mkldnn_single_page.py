"""
Benchmark enable_mkldnn=True sur une seule page représentative du CPS.

Ce script teste uniquement l'impact de enable_mkldnn sur le temps predict()
en utilisant une page représentative du CPS (page 6, baseline ~28.29 s).

Usage :
    python scripts/debug/benchmark_mkldnn_single_page.py <chemin_fichier_pdf> <num_page>
"""

import sys
import os
import time
import tempfile

# Ajouter le répertoire parent au path pour importer les modules du projet
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def benchmark_single_page(pdf_path: str, page_num: int = 6):
    """
    Benchmark enable_mkldnn=True sur une seule page du PDF.
    
    Args:
        pdf_path: Chemin vers le fichier PDF CPS
        page_num: Numéro de la page à tester (1-indexed)
    """
    import fitz  # PyMuPDF
    import cv2
    
    # Charger la page et la convertir en image
    print(f"[BENCHMARK] Chargement de la page {page_num} depuis {pdf_path}")
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]  # 0-indexed
    
    # Conversion PDF → image avec DPI 200
    print(f"[BENCHMARK] Conversion PDF → image (DPI 200)")
    conv_start = time.time()
    pix = page.get_pixmap(dpi=200)
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        page_img_path = os.path.join(tmp_dir, f"page_{page_num}.png")
        pix.save(page_img_path)
        conv_end = time.time()
        conv_time = conv_end - conv_start
        print(f"[BENCHMARK] Conversion terminée en {conv_time:.2f}s")
        
        # Charger l'image pour vérifier les dimensions
        img = cv2.imread(page_img_path)
        if img is not None:
            height, width = img.shape[:2]
            print(f"[BENCHMARK] Image dimensions: {width}x{height} pixels")
        
        # Lancer l'OCR avec PaddleOCR
        print(f"[BENCHMARK] Initialisation de PaddleOCR (enable_mkldnn=True)")
        from paddleocr import PaddleOCR
        
        ocr = PaddleOCR(
            lang='fr',
            text_detection_model_name="PP-OCRv6_small_det",
            text_recognition_model_name="PP-OCRv6_small_rec",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=True,
        )
        print(f"[BENCHMARK] PaddleOCR initialisé")
        
        # Lancer predict() et mesurer le temps
        print(f"[BENCHMARK] Lancement de predict() sur page {page_num}")
        predict_start = time.time()
        result = ocr.predict(page_img_path)
        predict_end = time.time()
        predict_time = predict_end - predict_start
        print(f"[BENCHMARK] predict() terminé en {predict_time:.2f}s")
        
        # Extraire et afficher le texte
        texts = []
        for item in result:
            if isinstance(item, dict):
                rec_texts = item.get("rec_texts", [])
                texts.extend(rec_texts)
            elif hasattr(item, "rec_texts"):
                texts.extend(item.rec_texts)
        
        texte_final = "\n".join(texts)
        print(f"[BENCHMARK] Nombre de blocs: {len(texts)}")
        print(f"[BENCHMARK] Nombre de caractères: {len(texte_final)}")
        print(f"[BENCHMARK] Aperçu texte: {texte_final[:200] if texte_final else '(vide)'}")
        
        # Comparaison avec la baseline
        baseline_time = 28.29  # Page 6 baseline
        gain = baseline_time - predict_time
        gain_percent = (gain / baseline_time) * 100
        
        print(f"\n[COMPARAISON]")
        print(f"Baseline (enable_mkldnn=False): {baseline_time:.2f}s")
        print(f"Actuel (enable_mkldnn=True): {predict_time:.2f}s")
        print(f"Gain: {gain:.2f}s ({gain_percent:.1f}%)")
        
        if gain > 0:
            print(f"[RÉSULTAT] POSITIF: enable_mkldnn=True améliore les performances de {gain_percent:.1f}%")
        else:
            print(f"[RÉSULTAT] NÉGATIF: enable_mkldnn=True dégrade les performances de {abs(gain_percent):.1f}%")
        
        return predict_time, len(texte_final)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/debug/benchmark_mkldnn_single_page.py <chemin_fichier_pdf> [num_page]")
        print("Exemple: python scripts/debug/benchmark_mkldnn_single_page.py /path/to/CPS.pdf 6")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    page_num = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    
    if not os.path.exists(pdf_path):
        print(f"Erreur: Le fichier {pdf_path} n'existe pas")
        sys.exit(1)
    
    try:
        benchmark_single_page(pdf_path, page_num)
    except Exception as e:
        print(f"[ERREUR] Benchmark échoué: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
