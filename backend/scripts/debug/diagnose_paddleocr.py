#!/usr/bin/env python
"""
Script de diagnostic pour identifier les versions et configuration PaddleOCR installées.
"""
import sys

print("=== DIAGNOSTIC PADDLEOCR ===")
print(f"Python version: {sys.version}")
print()

try:
    import paddleocr
    print(f"✓ PaddleOCR installé")
    try:
        print(f"  Version: {paddleocr.__version__}")
    except AttributeError:
        print(f"  Version: Non disponible (__version__ non défini)")
    print(f"  Chemin: {paddleocr.__file__}")
except ImportError as e:
    print(f"✗ PaddleOCR non installé: {e}")
print()

try:
    import paddle
    print(f"✓ PaddlePaddle installé")
    try:
        print(f"  Version: {paddle.__version__}")
    except AttributeError:
        print(f"  Version: Non disponible (__version__ non défini)")
    print(f"  Chemin: {paddle.__file__}")
    
    # Vérifier si GPU est disponible
    try:
        print(f"  GPU disponible: {paddle.device.is_compiled_with_cuda()}")
    except:
        print(f"  GPU disponible: Non vérifiable")
    
    # Vérifier le backend
    try:
        print(f"  Backend: {paddle.device.get_device()}")
    except:
        print(f"  Backend: Non vérifiable")
except ImportError as e:
    print(f"✗ PaddlePaddle non installé: {e}")
print()

# Variables d'environnement
import os
print("=== VARIABLES D'ENVIRONNEMENT ===")
print(f"OMP_NUM_THREADS: {os.environ.get('OMP_NUM_THREADS', 'Non défini')}")
print(f"MKL_NUM_THREADS: {os.environ.get('MKL_NUM_THREADS', 'Non défini')}")
print(f"CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES', 'Non défini')}")
print()

# Test d'initialisation PaddleOCR
print("=== TEST INITIALISATION PADDLEOCR ===")
try:
    from paddleocr import PaddleOCR
    print("✓ Import PaddleOCR réussi")
    
    # Tentative d'initialisation avec configuration minimale
    ocr = PaddleOCR(
        lang='fr',
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        enable_mkldnn=False,
    )
    print("✓ Initialisation PaddleOCR réussie")
    
    # Tenter d'accéder aux attributs internes
    try:
        print(f"  Modèle de détection: {getattr(ocr, 'text_detection_model_name', 'Non disponible')}")
    except:
        pass
    try:
        print(f"  Modèle de reconnaissance: {getattr(ocr, 'text_recognition_model_name', 'Non disponible')}")
    except:
        pass
    try:
        print(f"  Device: {getattr(ocr, 'device', 'Non disponible')}")
    except:
        pass
        
except Exception as e:
    print(f"✗ Erreur lors de l'initialisation: {e}")
    import traceback
    traceback.print_exc()
