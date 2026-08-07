#!/usr/bin/env python
"""
Profilage détaillé de PaddleOCR pour identifier le goulot d'étranglement.

Objectif : Comprendre pourquoi predict() prend ~60s par page sur une image de 1656×2339.
"""
import sys
import time
import os
from functools import wraps

def profile_step(step_name):
    """Décorateur pour profiler une étape spécifique."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            print(f"\n{'='*60}")
            print(f"ÉTAPE: {step_name}")
            print(f"{'='*60}")
            
            start = time.time()
            result = func(*args, **kwargs)
            end = time.time()
            
            duration = end - start
            print(f"Durée: {duration:.2f}s")
            
            return result
        return wrapper
    return decorator


def create_test_image():
    """Crée une image de test de 1656×2339 pixels (A4 à 200 DPI)."""
    try:
        import cv2
        import numpy as np
        
        width, height = 1656, 2339
        img = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        # Ajouter du texte noir pour simuler un document
        cv2.putText(img, "Test OCR Profilage - Page 1", (50, 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        cv2.putText(img, "This is a test document for OCR profiling", (50, 200), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 2)
        
        # Ajouter plusieurs lignes de texte
        for i in range(10):
            y = 300 + i * 100
            cv2.putText(img, f"Ligne de test numéro {i+1} pour simuler un document réel", (50, y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        test_img_path = "test_ocr_1656x2339.png"
        cv2.imwrite(test_img_path, img)
        return test_img_path
    except ImportError:
        print("OpenCV non disponible, création d'image impossible")
        return None


@profile_step("Initialisation PaddleOCR")
def init_paddleocr():
    """Initialise PaddleOCR et mesure le temps."""
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
    
    # Variables d'environnement
    print(f"OMP_NUM_THREADS: {os.environ.get('OMP_NUM_THREADS', 'Non défini')}")
    print(f"MKL_NUM_THREADS: {os.environ.get('MKL_NUM_THREADS', 'Non défini')}")
    print(f"CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES', 'Non défini')}")
    
    try:
        ocr = PaddleOCR(
            lang='fr',
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
        )
        print("✓ Initialisation réussie")
        return ocr
    except Exception as e:
        print(f"✗ Erreur lors de l'initialisation: {e}")
        return None


@profile_step("Premier appel predict() (warm-up)")
def first_predict(ocr, img_path):
    """Premier appel predict() pour mesurer le warm-up."""
    try:
        result = ocr.predict(img_path)
        print(f"Nombre de résultats: {len(result)}")
        return result
    except Exception as e:
        print(f"✗ Erreur lors du predict: {e}")
        return None


@profile_step("Deuxième appel predict() (normal)")
def second_predict(ocr, img_path):
    """Deuxième appel predict() pour mesurer le temps normal."""
    try:
        result = ocr.predict(img_path)
        print(f"Nombre de résultats: {len(result)}")
        return result
    except Exception as e:
        print(f"✗ Erreur lors du predict: {e}")
        return None


@profile_step("Troisième appel predict() (normal)")
def third_predict(ocr, img_path):
    """Troisième appel predict() pour confirmer la stabilité."""
    try:
        result = ocr.predict(img_path)
        print(f"Nombre de résultats: {len(result)}")
        return result
    except Exception as e:
        print(f"✗ Erreur lors du predict: {e}")
        return None


def profile_internal_steps(ocr, img_path):
    """
    Profile les étapes internes de PaddleOCR (détection, reconnaissance).
    Nécessite d'accéder aux attributs internes de PaddleOCR.
    """
    print(f"\n{'='*60}")
    print("ÉTAPE: Analyse interne PaddleOCR")
    print(f"{'='*60}")
    
    try:
        # Tenter d'accéder aux attributs internes
        if hasattr(ocr, 'text_detector'):
            print("✓ text_detector disponible")
        else:
            print("✗ text_detector non disponible")
        
        if hasattr(ocr, 'text_recognizer'):
            print("✓ text_recognizer disponible")
        else:
            print("✗ text_recognizer non disponible")
        
        if hasattr(ocr, 'use_gpu'):
            print(f"use_gpu: {ocr.use_gpu}")
        else:
            print("use_gpu: Non disponible")
        
        if hasattr(ocr, 'device'):
            print(f"device: {ocr.device}")
        else:
            print("device: Non disponible")
        
    except Exception as e:
        print(f"✗ Erreur lors de l'analyse interne: {e}")


def main():
    print("="*60)
    print("PROFILAGE DÉTAILLÉ PADDLEOCR")
    print("="*60)
    print(f"Python version: {sys.version}")
    print()
    
    # Créer image de test
    img_path = create_test_image()
    if not img_path:
        print("✗ Impossible de créer l'image de test")
        return
    
    print(f"Image de test: {img_path}")
    print(f"Taille: {os.path.getsize(img_path) / 1024:.1f} KB")
    
    # Profilage
    ocr = init_paddleocr()
    if not ocr:
        print("✗ Impossible d'initialiser PaddleOCR")
        return
    
    # Analyse interne
    profile_internal_steps(ocr, img_path)
    
    # Tests predict()
    first_predict(ocr, img_path)
    second_predict(ocr, img_path)
    third_predict(ocr, img_path)
    
    # Nettoyer
    if os.path.exists(img_path):
        os.remove(img_path)
        print(f"\nImage de test supprimée: {img_path}")
    
    print("\n" + "="*60)
    print("PROFILAGE TERMINÉ")
    print("="*60)


if __name__ == "__main__":
    main()
