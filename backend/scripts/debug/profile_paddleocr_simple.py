#!/usr/bin/env python
"""
Profilage simplifié de PaddleOCR.

Utilise le même environnement que le projet pour éviter les problèmes d'imports.
"""
import sys
import os
import time

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    print("="*60)
    print("PROFILAGE PADDLEOCR")
    print("="*60)
    print(f"Python version: {sys.version}")
    print()
    
    # Variables d'environnement
    print("Variables d'environnement:")
    print(f"  OMP_NUM_THREADS: {os.environ.get('OMP_NUM_THREADS', 'Non défini')}")
    print(f"  MKL_NUM_THREADS: {os.environ.get('MKL_NUM_THREADS', 'Non défini')}")
    print(f"  CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES', 'Non défini')}")
    print()
    
    # Test d'import
    print("Test d'import PaddleOCR:")
    try:
        import paddleocr
        print(f"  ✓ Version PaddleOCR: {paddleocr.__version__}")
    except ImportError as e:
        print(f"  ✗ PaddleOCR non installé: {e}")
        return
    
    try:
        import paddle
        print(f"  ✓ Version PaddlePaddle: {paddle.__version__}")
    except ImportError:
        print("  ✗ PaddlePaddle non disponible")
        return
    
    print()
    
    # Initialisation
    print("Initialisation PaddleOCR:")
    init_start = time.time()
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(
            lang='fr',
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
        )
        init_end = time.time()
        print(f"  ✓ Initialisation réussie: {init_end - init_start:.2f}s")
    except Exception as e:
        print(f"  ✗ Erreur lors de l'initialisation: {e}")
        return
    
    print()
    
    # Créer image de test
    print("Création image de test:")
    try:
        import cv2
        import numpy as np
        
        width, height = 1656, 2339
        img = np.ones((height, width, 3), dtype=np.uint8) * 255
        
        cv2.putText(img, "Test OCR Profilage", (50, 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
        
        test_img_path = "test_ocr_1656x2339.png"
        cv2.imwrite(test_img_path, img)
        print(f"  ✓ Image créée: {test_img_path}")
        print(f"  ✓ Taille: {os.path.getsize(test_img_path) / 1024:.1f} KB")
    except Exception as e:
        print(f"  ✗ Erreur lors de la création de l'image: {e}")
        return
    
    print()
    
    # Tests predict()
    print("Tests predict():")
    for i in range(3):
        print(f"\n  Appel {i+1}:")
        predict_start = time.time()
        try:
            result = ocr.predict(test_img_path)
            predict_end = time.time()
            duration = predict_end - predict_start
            print(f"    ✓ Durée: {duration:.2f}s")
            print(f"    ✓ Résultats: {len(result)}")
        except Exception as e:
            print(f"    ✗ Erreur: {e}")
    
    # Nettoyer
    if os.path.exists(test_img_path):
        os.remove(test_img_path)
        print(f"\nImage de test supprimée: {test_img_path}")
    
    print("\n" + "="*60)
    print("PROFILAGE TERMINÉ")
    print("="*60)


if __name__ == "__main__":
    main()
