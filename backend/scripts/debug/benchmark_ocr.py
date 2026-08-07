#!/usr/bin/env python
"""
Benchmark indépendant pour comparer les performances OCR.
Ce script n'utilise PAS le pipeline du projet, uniquement les bibliothèques OCR directement.
"""
import time
import os
import sys

# Créer une image de test simple si elle n'existe pas
def create_test_image():
    """Crée une image de test de 1656x2339 pixels (A4 à 200 DPI)"""
    try:
        import cv2
        import numpy as np
        
        # Image blanche avec du texte noir (simulant un document A4)
        width, height = 1656, 2339
        img = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Ajouter du texte noir pour simuler un document
        cv2.putText(img, "Test OCR Benchmark - Page 1", (50, 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        cv2.putText(img, "This is a test document for OCR performance comparison", (50, 200), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 2)
        
        # Sauvegarder
        test_img_path = "test_ocr_1656x2339.png"
        cv2.imwrite(test_img_path, img)
        return test_img_path
    except ImportError:
        print("OpenCV non disponible, création d'image impossible")
        return None

def benchmark_paddleocr_model(img_path, model_name, text_det_model, text_rec_model):
    """Benchmark un modèle PaddleOCR spécifique"""
    print(f"\n=== BENCHMARK PADDLEOCR - {model_name} ===")
    
    try:
        from paddleocr import PaddleOCR
        import paddleocr
        print(f"Version PaddleOCR: {paddleocr.__version__}")
    except ImportError as e:
        print(f"✗ PaddleOCR non installé: {e}")
        return None
    
    try:
        import paddle
        print(f"Version PaddlePaddle: {paddle.__version__}")
    except ImportError:
        print("Version PaddlePaddle: Non disponible")
    
    # Temps de création du modèle
    init_start = time.time()
    try:
        ocr = PaddleOCR(
            lang='fr',
            text_detection_model_name=text_det_model,
            text_recognition_model_name=text_rec_model,
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
        )
        init_end = time.time()
        init_time = init_end - init_start
        print(f"Initialisation modèle: {init_time:.2f}s")
    except Exception as e:
        print(f"✗ Erreur lors de l'initialisation: {e}")
        return None
    
    # Temps predict() x3
    predict_times = []
    for i in range(3):
        predict_start = time.time()
        result = ocr.predict(img_path)
        predict_end = time.time()
        predict_time = predict_end - predict_start
        predict_times.append(predict_time)
        print(f"Predict() {i+1}: {predict_time:.2f}s (résultats: {len(result)})")
    
    return {
        'init': init_time,
        'predict1': predict_times[0],
        'predict2': predict_times[1],
        'predict3': predict_times[2],
        'avg_predict': sum(predict_times) / len(predict_times)
    }

def benchmark_paddleocr(img_path):
    """Benchmark tous les modèles PaddleOCR"""
    print("\n=== BENCHMARK PADDLEOCR - COMPARAISON MODÈLES ===")
    
    results = {}
    
    # PP-OCRv6_medium (actuel)
    result = benchmark_paddleocr_model(
        img_path, 
        "PP-OCRv6_medium", 
        "PP-OCRv6_medium_det", 
        "PP-OCRv6_medium_rec"
    )
    if result:
        results['PP-OCRv6_medium'] = result
    
    # PP-OCRv6_small
    result = benchmark_paddleocr_model(
        img_path, 
        "PP-OCRv6_small", 
        "PP-OCRv6_small_det", 
        "PP-OCRv6_small_rec"
    )
    if result:
        results['PP-OCRv6_small'] = result
    
    # PP-OCRv5_mobile
    result = benchmark_paddleocr_model(
        img_path, 
        "PP-OCRv5_mobile", 
        "PP-OCRv5_mobile_det", 
        "PP-OCRv5_mobile_rec"
    )
    if result:
        results['PP-OCRv5_mobile'] = result
    
    return results

def benchmark_easyocr(img_path):
    """Benchmark EasyOCR"""
    print("\n=== BENCHMARK EASYOCR ===")
    
    try:
        import easyocr
        print(f"Version EasyOCR: {easyocr.__version__}")
    except ImportError as e:
        print(f"✗ EasyOCR non installé: {e}")
        return None
    
    # Temps de création du modèle
    init_start = time.time()
    reader = easyocr.Reader(['fr'], gpu=False)
    init_end = time.time()
    init_time = init_end - init_start
    print(f"Initialisation modèle: {init_time:.2f}s")
    
    # Temps predict() x3
    predict_times = []
    for i in range(3):
        predict_start = time.time()
        result = reader.readtext(img_path)
        predict_end = time.time()
        predict_time = predict_end - predict_start
        predict_times.append(predict_time)
        print(f"Predict() {i+1}: {predict_time:.2f}s (résultats: {len(result)})")
    
    return {
        'init': init_time,
        'predict1': predict_times[0],
        'predict2': predict_times[1],
        'predict3': predict_times[2],
        'avg_predict': sum(predict_times) / len(predict_times)
    }

def benchmark_tesseract(img_path):
    """Benchmark Tesseract"""
    print("\n=== BENCHMARK TESSERACT ===")
    
    try:
        import pytesseract
        print(f"Version Tesseract: {pytesseract.get_tesseract_version()}")
    except ImportError as e:
        print(f"✗ pytesseract non installé: {e}")
        return None
    
    # Temps de création (pas d'initialisation lourde pour Tesseract)
    init_time = 0.0
    print(f"Initialisation modèle: {init_time:.2f}s (pas d'initialisation)")
    
    # Temps predict() x3
    predict_times = []
    for i in range(3):
        predict_start = time.time()
        result = pytesseract.image_to_string(img_path)
        predict_end = time.time()
        predict_time = predict_end - predict_start
        predict_times.append(predict_time)
        print(f"Predict() {i+1}: {predict_time:.2f}s (caractères: {len(result)})")
    
    return {
        'init': init_time,
        'predict1': predict_times[0],
        'predict2': predict_times[1],
        'predict3': predict_times[2],
        'avg_predict': sum(predict_times) / len(predict_times)
    }

def main():
    print("=== BENCHMARK INDÉPENDANT OCR ===")
    print(f"Python version: {sys.version}")
    print()
    
    # Créer image de test
    img_path = create_test_image()
    if not img_path:
        print("✗ Impossible de créer l'image de test")
        return
    
    print(f"Image de test: {img_path}")
    print(f"Taille: {os.path.getsize(img_path) / 1024:.1f} KB")
    
    # Benchmarks PaddleOCR
    paddleocr_results = benchmark_paddleocr(img_path)
    
    # Tableau récapitulatif PaddleOCR
    if paddleocr_results:
        print("\n=== TABLEAU RÉCAPITULATIF PADDLEOCR ===")
        print(f"{'Modèle':<20} {'Init':<10} {'Predict1':<12} {'Predict2':<12} {'Predict3':<12} {'Avg Predict':<12}")
        print("-" * 90)
        
        for model_name, result in paddleocr_results.items():
            print(f"{model_name:<20} {result['init']:<10.2f} {result['predict1']:<12.2f} {result['predict2']:<12.2f} {result['predict3']:<12.2f} {result['avg_predict']:<12.2f}")
    
    # Nettoyer
    if os.path.exists(img_path):
        os.remove(img_path)
        print(f"\nImage de test supprimée: {img_path}")

if __name__ == "__main__":
    main()
