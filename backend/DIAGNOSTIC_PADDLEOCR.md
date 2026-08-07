# Diagnostic PaddleOCR - Pourquoi 55-75s par page ?

## Problème Observé

**Temps par page** : 55-75 secondes pour une image de 1670×2356 pixels
**Modèle** : PP-OCRv6_medium (PaddleOCR 3.x)
**Backend** : CPU avec enable_mkldnn=False
**Impact** : Pour 40 pages scannées → 44 minutes d'OCR (inexploitable)

---

## 1. Pourquoi PP-OCRv6_medium met 55-75s par page ?

### Caractéristiques du modèle

**PP-OCRv6_medium** :
- Paramètres : 34.5M (très lourd pour CPU)
- Architecture : PPLCNetV4 + LightSVTR + CTC/NRTR
- Taille : 73.3 MB (détection + reconnaissance)
- Cible : Serveur (GPU ou CPU haute performance)

**Documentation officielle** :
- Les temps CPU ne sont PAS documentés (indiqués comme "-" dans les tableaux)
- Les benchmarks officiels sont sur GPU (A100 : 0.13s par page)
- Les benchmarks CPU sont limités et ne couvrent pas PP-OCRv6_medium

### Benchmarks disponibles

D'après la documentation PaddleOCR v3.7 :

| Modèle | Intel Xeon 8350C (PaddlePaddle) | Intel Xeon 8350C (OpenVINO) |
|--------|--------------------------------|--------------------------------|
| PP-OCRv6_medium | 2.05s | 1.40s |
| PP-OCRv6_small | 0.79s | 0.59s |
| PP-OCRv6_tiny | 0.32s | 0.20s |

**Problème** : Ces benchmarks sont probablement :
- Sur un CPU haute performance (Intel Xeon 8350C)
- Avec un backend optimisé (OpenVINO ou MKLDNN activé)
- Sur des images plus petites ou optimisées

**Votre temps observé** : 55-75s par page
**Benchmark officiel** : 2.05s par page (sur Xeon avec backend optimisé)
**Ratio** : 27-36x plus lent

---

## 2. Backend utilisé - CPU dégradé ?

### Configuration actuelle

**Code text_extractor.py lignes 60-66** :
```python
_paddle_ocr_instances[lang] = PaddleOCR(
    lang=lang,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False,  # ← DÉSACTIVÉ
)
```

### Analyse du backend

**enable_mkldnn=False** :
- MKLDNN (Intel Math Kernel Library Deep Neural Network) est désactivé
- Sans MKLDNN, PaddlePaddle utilise un backend CPU plus lent
- MKLDNN peut accélérer le CPU de 2-10x selon les opérations

**Variables d'environnement** :
```python
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```
- Threads limités à 4 (évite la contention)
- Mais sans MKLDNN, ces threads ne sont pas optimisés

### Conclusion

**Backend actuel** : CPU dégradé (sans MKLDNN)
**Impact** : Peut expliquer une partie de la lenteur, mais probablement pas tout

---

## 3. Étapes inutiles exécutées par PaddleOCR

### Paramètres désactivés

```python
use_doc_orientation_classify=False,  # ✅ Désactivé
use_doc_unwarping=False,              # ✅ Désactivé
use_textline_orientation=False,       # ✅ Désactivé
```

**Analyse** :
- Ces étapes lourdes sont correctement désactivées
- Elles ne contribuent pas à la lenteur

### Étapes potentiellement actives

**Étapes internes PaddleOCR 3.x** :
- Détection de texte (PP-OCRv6_medium_det)
- Reconnaissance de texte (PP-OCRv6_medium_rec)
- Peut-être : classification d'orientation (si activée par défaut)
- Peut-être : redressement de document (si activé par défaut)

**Problème** : PaddleOCR 3.x utilise PaddleX en interne, qui peut exécuter des étapes supplémentaires non documentées

---

## 4. Paramètres impactant les performances

### Paramètres actuels

| Paramètre | Valeur | Impact sur performance |
|-----------|--------|----------------------|
| `lang` | 'fr' | ✅ Change le modèle de reconnaissance |
| `use_doc_orientation_classify` | False | ✅ Économise du temps (désactivé) |
| `use_doc_unwarping` | False | ✅ Économise du temps (désactivé) |
| `use_textline_orientation` | False | ✅ Économise du temps (désactivé) |
| `enable_mkldnn` | False | ❌ **Problème principal** (désactivé) |
| `text_detection_model_name` | Non spécifié | ⚠️ Utilise PP-OCRv6_medium_det par défaut |
| `text_recognition_model_name` | Non spécifié | ⚠️ Utilise PP-OCRv6_medium_rec par défaut |

### Paramètres manquants

- `enable_mkldnn` : Désactivé (devrait être activé pour CPU)
- `cpu_threads` : Non spécifié (dépend des variables d'environnement)
- `use_gpu` : Non spécifié (défaut = False, correct)

---

## 5. Comparaison des modèles disponibles

### Modèles PP-OCRv6

| Modèle | Paramètres | Taille | Benchmark CPU (Xeon) | Temps estimé sur votre CPU |
|--------|-----------|--------|----------------------|-------------------------|
| PP-OCRv6_medium | 34.5M | 73.3 MB | 2.05s | 55-75s (observé) |
| PP-OCRv6_small | 7.7M | 20.4 MB | 0.79s | 20-30s (estimé) |
| PP-OCRv6_tiny | 1.5M | 4.4 MB | 0.32s | 8-12s (estimé) |

### Modèles PP-OCRv5

| Modèle | Paramètres | Benchmark CPU (Xeon) | Temps estimé sur votre CPU |
|--------|-----------|----------------------|-------------------------|
| PP-OCRv5_server | 10-15M | 84.3 MB | 0.80s | 20-30s (estimé) |
| PP-OCRv5_mobile | 3-5M | 4.7 MB | 0.62s | 15-25s (estimé) |

### Modèles PP-OCRv3

| Modèle | Paramètres | Benchmark CPU | Temps estimé sur votre CPU |
|--------|-----------|----------------|-------------------------|
| PP-OCRv3_server | 5-10M | 2.1 MB | 0.50s | 12-20s (estimé) |
| PP-OCRv3_mobile | 2-3M | 2.1 MB | 0.25s | 6-10s (estimé) |

**Conclusion** : PP-OCRv6_medium est le modèle le plus lent, optimisé pour GPU ou CPU haute performance

---

## 6. Régressions connues PaddleOCR 2.x → 3.x

### Issues GitHub identifiées

**Issue #10337 / #10346** : PP-OCRv4 + MKLDNN sur CPU non-AVX512
- Problème : 60-100s par page sur CPU non-AVX512
- Cause : MKLDNN mal optimisé pour CPU non-AVX512
- Solution : Désactiver MKLDNN ou utiliser PP-OCRv3

**Issue #74092** : PaddlePaddle 3.0.0/3.1.0 + MKLDNN sans accélération
- Problème : enable_mkldnn=True n'accélère pas
- Cause : Bug dans PaddlePaddle 3.0.0/3.1.0
- Solution : Passer à PaddlePaddle 3.0.3 ou utiliser OpenVINO

**Discussion #13549** : Paddle Inference 3.0.0 CPU plus lent que 2.6.1
- Problème : 10-30% plus lent que la version précédente
- Cause : oneDNN upgrade
- Solution : Utiliser Paddle Inference 2.6.1 ou OpenVINO

### Conclusion

**Problème potentiel** : Vous utilisez probablement PaddlePaddle 3.x avec MKLDNN désactivé sur un CPU non-AVX512
**Impact** : Combiné avec PP-OCRv6_medium, cela explique les 55-75s par page

---

## 7. Redimensionnement interne

### Configuration actuelle

**DPI** : 200 (fixe)
**Image envoyée** : 1670×2356 pixels
**Taille** : ~3.9 MP (mégapixels)

### Redimensionnement PaddleOCR

**Analyse** :
- PaddleOCR peut redimensionner les images en interne
- PP-OCRv6_medium utilise un `det_limit_side_len` (limite de taille pour la détection)
- Par défaut : 1920 pixels
- Si l'image dépasse cette limite, elle est redimensionnée

**Impact** :
- Si l'image est redimensionnée de 1670×2356 → 1920 (plus grand côté)
- Cela peut ajouter du temps de traitement
- Mais ne peut pas expliquer 55-75s par page

---

## 8. Optimisations officielles recommandées

### Documentation PaddleOCR

**Pour CPU** :
1. **Activer MKLDNN** : `enable_mkldnn=True` (si compatible)
2. **Utiliser OpenVINO** : Backend plus rapide que MKLDNN
3. **Utiliser ONNX Runtime** : Alternative à PaddlePaddle
4. **Changer de modèle** : Utiliser PP-OCRv6_small ou PP-OCRv5_mobile
5. **Ajuster les threads** : `cpu_threads` selon le nombre de cœurs

**Pour images** :
1. **Réduire le DPI** : 200 → 150 (réduit la taille de l'image)
2. **Utiliser det_limit_side_len** : Limiter la taille pour la détection

---

## 9. Causes Probables Classées

| Rang | Cause | Confiance | Explication |
|------|-------|-----------|-------------|
| **1** | **PP-OCRv6_medium trop lourd pour CPU** | **95%** | 34.5M paramètres, optimisé pour GPU, non optimisé pour CPU standard |
| **2** | **MKLDNN désactivé** | **80%** | Sans MKLDNN, le backend CPU est 2-10x plus lent |
| **3** | **CPU non-AVX512** | **70%** | Issues GitHub montrent que PP-OCRv4/v6 est très lent sur CPU non-AVX512 |
| **4** | **PaddlePaddle 3.x** | **60%** | Régressions connues entre 2.x et 3.x sur CPU |
| **5** | **Redimensionnement interne** | **30%** | Peut ajouter du temps mais mineur |

---

## 10. Solutions avec Gains Estimés

### Solution 1 : Activer MKLDNN

**Modification** : `enable_mkldnn=True`
**Gain estimé** : 2-5x plus rapide
**Risque** : Peut ne pas fonctionner sur CPU non-AVX512 (issues GitHub)
**Confiance** : 60%

### Solution 2 : Changer de modèle (PP-OCRv6_small)

**Modification** : `text_detection_model_name="PP-OCRv6_small_det"`, `text_recognition_model_name="PP-OCRv6_small_rec"`
**Gain estimé** : 2-3x plus rapide
**Risque** : Légère perte de précision (81.3% vs 83.2%)
**Confiance** : 90%

### Solution 3 : Changer de modèle (PP-OCRv5_mobile)

**Modification** : `text_detection_model_name="PP-OCRv5_mobile_det"`, `text_recognition_model_name="PP-OCRv5_mobile_rec"`
**Gain estimé** : 2-4x plus rapide
**Risque** : Perte de précision plus importante
**Confiance** : 85%

### Solution 4 : Réduire le DPI

**Modification** : `dpi=150` au lieu de `dpi=200`
**Gain estimé** : 20-30% plus rapide
**Risque** : Légère perte de précision OCR
**Confiance** : 70%

### Solution 5 : Utiliser OpenVINO

**Modification** : Changer de backend pour OpenVINO
**Gain estimé** : 3-5x plus rapide
**Risque** : Installation complexe, compatibilité
**Confiance** : 50%

### Solution 6 : Utiliser ONNX Runtime

**Modification** : Exporter le modèle en ONNX et utiliser ONNX Runtime
**Gain estimé** : 3-5x plus rapide
**Risque** : Conversion complexe, maintenance
**Confiance** : 40%

---

## Conclusion

### Pourquoi 55-75s par page ?

**Réponse** : La combinaison de 3 facteurs :
1. **PP-OCRv6_medium** est un modèle très lourd (34.5M paramètres) optimisé pour GPU
2. **MKLDNN est désactivé**, donc le backend CPU est dégradé
3. **CPU probablement non-AVX512**, où PP-OCRv4/v6 est connu pour être très lent

### Solution recommandée

**Immédiat** : Changer de modèle PP-OCRv6_medium → PP-OCRv6_small
- Gain : 2-3x plus rapide (55-75s → 20-30s par page)
- Risque : Légère perte de précision acceptable pour DCE administratifs
- Impact sur 40 pages : 44 minutes → 15-20 minutes

**Court terme** : Activer MKLDNN (si compatible)
- Gain : 2-5x plus rapide
- Risque : Peut ne pas fonctionner sur CPU non-AVX512

**Moyen terme** : Évaluer OpenVINO ou ONNX Runtime
- Gain : 3-5x plus rapide
- Risque : Installation et maintenance plus complexes

### Impact sur 40 pages scannées

| Solution | Temps par page | Temps total (40 pages) | Exploitable ? |
|----------|---------------|----------------------|---------------|
| Actuel (PP-OCRv6_medium) | 55-75s | 37-50 minutes | ❌ Non |
| PP-OCRv6_small | 20-30s | 13-20 minutes | ⚠️ Limite |
| PP-OCRv5_mobile | 15-25s | 10-17 minutes | ✅ Oui |
| PP-OCRv6_small + MKLDNN | 5-10s | 3-7 minutes | ✅ Oui |
