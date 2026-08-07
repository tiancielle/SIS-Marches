# Diagnostic - Pourquoi PaddleOCR prend 60s par page ?

## Problème

**Observation** : PaddleOCR prend ~60 secondes par page sur une image de 1656×2339 pixels.

**Question** : Est-ce normal ? Non, même sur CPU, une page A4 devrait prendre quelques secondes, pas une minute.

## Hypothèses à vérifier

### 1. Recréation d'instance PaddleOCR à chaque page

**Code actuel** : `text_extractor.py` lignes 47-68
```python
_paddle_ocr_instances: dict[str, object] = {}

def _get_paddle_ocr(lang: str):
    if lang not in _paddle_ocr_instances:
        logger.info(f"[DIAG] Chargement de PaddleOCR (lang={lang})...")
        _paddle_ocr_instances[lang] = PaddleOCR(...)
    return _paddle_ocr_instances[lang]
```

**Vérification** : ✅ Singleton fonctionne, instance créée une seule fois par langue

**Conclusion** : ❌ Pas de recréation d'instance

---

### 2. Rechargement des modèles à chaque appel

**Code actuel** : PaddleOCR charge les modèles une seule fois à l'initialisation

**Vérification** : Pas de rechargement explicite dans le code

**Conclusion** : ❌ Pas de rechargement de modèles

---

### 3. Conversion PDF à résolution trop élevée

**Code actuel** : `text_extractor.py` ligne 322
```python
pix = page.get_pixmap(dpi=200)
```

**DPI** : 200 (fixe)
**Image normale** : 1656×2339 pixels (A4 à 200 DPI)
**Taille** : ~3.9 MP (mégapixels)

**Comparaison** :
- 200 DPI est standard pour OCR
- 300 DPI serait ~9 MP (plus lent)
- 150 DPI serait ~2.2 MP (plus rapide)

**Conclusion** : ⚠️ DPI 200 est raisonnable, mais pourrait être réduit à 150 pour gagner du temps

---

### 4. Configuration PaddlePaddle

**Variables d'environnement** : `text_extractor.py` lignes 20-21
```python
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```

**Paramètres PaddleOCR** : `text_extractor.py` lignes 60-66
```python
_paddle_ocr_instances[lang] = PaddleOCR(
    lang=lang,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False,  # ← DÉSACTIVÉ
)
```

**Problème potentiel** :
- `enable_mkldnn=False` désactive l'accélération Intel MKL-DNN
- Sans MKL-DNN, PaddlePaddle utilise un backend CPU plus lent
- MKL-DNN peut accélérer le CPU de 2-10x selon les opérations

**Conclusion** : ✅ PROBABLE - `enable_mkldnn=False` est très probablement la cause principale

---

### 5. Prétraitements OpenCV

**Code actuel** : `text_extractor.py` lignes 142-220
```python
def _preprocess_image_for_ocr(img_path: str) -> str:
    # 1. Conversion en niveaux de gris
    # 2. Correction de rotation (deskew)
    # 3. Amélioration du contraste (CLAHE)
    # 4. Binarisation adaptative
    # 5. Réduction du bruit (median blur)
```

**Temps estimé** : 0.5-1.0s par image

**Conclusion** : ❌ Ne peut pas expliquer 60s par page

---

### 6. Modèle PP-OCRv6_medium

**Caractéristiques** :
- Paramètres : 34.5M (très lourd pour CPU)
- Architecture : PPLCNetV4 + LightSVTR + CTC/NRTR
- Taille : 73.3 MB

**Benchmarks officiels** :
- Intel Xeon 8350C (PaddlePaddle) : 2.05s par page
- Intel Xeon 8350C (OpenVINO) : 1.40s par page

**Problème** :
- Votre temps observé : 60s par page
- Benchmark officiel : 2.05s par page
- Ratio : 29x plus lent

**Conclusion** : ✅ PROBABLE - Le modèle est trop lourd pour votre CPU sans MKL-DNN

---

## Causes Probables Classées

| Rang | Cause | Confiance | Impact estimé |
|------|-------|-----------|---------------|
| **1** | **enable_mkldnn=False** | **90%** | **2-10x plus lent** |
| **2** | **PP-OCRv6_medium trop lourd** | **80%** | **5-10x plus lent** |
| 3 | CPU non-AVX512 | 70% | 2-3x plus lent |
| 4 | DPI 200 | 30% | 10-20% plus lent |

---

## Solutions Recommandées

### Solution 1 : Activer MKLDNN (priorité)

**Modification** : `enable_mkldnn=True`
**Gain estimé** : 2-5x plus rapide
**Risque** : Peut ne pas fonctionner sur CPU non-AVX512 (issues GitHub #10337, #10346)
**Test** : Essayer et vérifier si ça fonctionne

### Solution 2 : Changer de modèle

**Modification** : PP-OCRv6_small ou PP-OCRv5_mobile
**Gain estimé** : 2-3x plus rapide
**Risque** : Légère perte de précision
**Impact** : 60s → 20-30s par page

### Solution 3 : Réduire le DPI

**Modification** : `dpi=150` au lieu de `dpi=200`
**Gain estimé** : 20-30% plus rapide
**Risque** : Légère perte de précision OCR
**Impact** : 60s → 40-50s par page

### Solution 4 : Tester avec enable_mkldnn=True + PP-OCRv6_small

**Gain estimé** : 4-15x plus rapide
**Impact** : 60s → 4-15s par page

---

## Recommandation

**Immédiat** : Tester `enable_mkldnn=True` sur votre machine
- Si ça fonctionne : gain immédiat de 2-5x
- Si ça ne fonctionne pas : passer à Solution 2 (changement de modèle)

**Court terme** : Si MKLDNN ne fonctionne pas, changer de modèle PP-OCRv6_small

**Moyen terme** : Évaluer OpenVINO ou ONNX Runtime pour des gains supplémentaires

---

## Conclusion

La cause la plus probable est la combinaison de :
1. `enable_mkldnn=False` (désactive l'accélération CPU)
2. PP-OCRv6_medium (modèle très lourd pour CPU)
3. CPU probablement non-AVX512

Si on active MKLDNN et/ou change de modèle, on devrait passer de 60s par page à 5-15s par page, ce qui rendrait l'OCR exploitable même pour les gros documents.
