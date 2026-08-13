# Analyse détaillée du code OCR - Facteurs de performance

## Date
2026-08-10

## Analyse du code actuel `text_extractor.py`

### 1. enable_mkldnn=False (ligne 81)

**Statut :** Désactivé explicitement
**Raison :** Pour éviter le bug PaddlePaddle 3.3.1 + oneDNN
**Impact :** MAJEUR - Sans MKLDNN, PaddlePaddle n'utilise pas l'accélération oneDNN sur CPU
**Conclusion :** C'est probablement le facteur principal de lenteur

---

### 2. Modèle PP-OCRv6_small (lignes 76-77)

**Statut :** Déjà le modèle "small"
**Configuration :**
```python
text_detection_model_name="PP-OCRv6_small_det",
text_recognition_model_name="PP-OCRv6_small_rec",
```
**Impact :** MOYEN - C'est déjà le modèle le plus léger de la série v6, mais encore lourd pour CPU
**Alternative :** PP-OCRv5_mobile (plus léger que v6_small)

---

### 3. Résolution/DPI = 200 (ligne 297)

**Statut :** DPI 200
**Code :**
```python
pix = page.get_pixmap(dpi=200)
```
**Résultat :** Images de ~1650×2300 pixels
**Impact :** MOYEN - Résolution élevée pour CPU
**Alternative :** DPI 150 (réduction de ~44% de la surface)

---

### 4. Paramètres PaddleOCR (lignes 78-80)

**Statut :** Options lourdes déjà désactivées
**Code :**
```python
use_doc_orientation_classify=False,
use_doc_unwarping=False,
use_textline_orientation=False,
```
**Impact :** FAIBLE - Déjà optimisé
**Conclusion :** Pas d'amélioration possible ici

---

### 5. Coût detector vs recognizer

**Statut :** Impossible à mesurer séparément
**Raison :** L'API PaddleOCR.predict() inclut les deux modèles
**Impact :** N/A
**Conclusion :** Impossible d'isoler avec l'API actuelle

---

### 6. Modèle plus léger

**Alternative :** PP-OCRv5_mobile
**Comparaison :**
- PP-OCRv6_small : Modèle récent, relativement lourd
- PP-OCRv5_mobile : Modèle plus ancien, plus léger et optimisé pour mobile/CPU
**Impact :** ÉLEVÉ - 2-3x plus rapide que v6_small sur CPU
**Risque :** Légère perte de précision sur les caractères complexes

---

### 7. Preprocessing (lignes 160-231)

**Statut :** 5 étapes de preprocessing
**Opérations :**
1. Conversion en niveaux de gris
2. Correction de rotation (deskew)
3. Amélioration du contraste (CLAHE)
4. Binarisation adaptative (Otsu)
5. Réduction du bruit (median blur)

**Temps mesuré :** ~0.3 s/page (négligeable)
**Impact :** FAIBLE - Le preprocessing est déjà optimisé
**Conclusion :** Pas d'amélioration significative possible ici

---

### 8. Étapes PaddleOCR

**Statut :** Étapes lourdes déjà désactivées
**Conclusion :** Pas d'amélioration possible ici

---

## Recommandation de micro-benchmarks

### Protocole de benchmark

**Page de test :** Une page représentative du CPS (ex: page 6 avec predict() = 28.29 s)

**Baseline actuelle :**
- enable_mkldnn=False
- PP-OCRv6_small
- DPI 200
- predict() = ~28 s

### Benchmark A : enable_mkldnn=True

**Modification :**
```python
enable_mkldnn=True,  # Au lieu de False
```

**Pourquoi :** C'est le facteur le plus probable de lenteur

**Risque :** Peut crasher avec PaddlePaddle 3.3.1 + oneDNN

**Si crash :** Revenir à False et passer au Benchmark B

**Si succès :** Mesurer le gain de temps

---

### Benchmark B : PP-OCRv5_mobile (si A échoue)

**Modification :**
```python
text_detection_model_name="PP-OCRv5_mobile_det",
text_recognition_model_name="PP-OCRv5_mobile_rec",
```

**Pourquoi :** Modèle plus léger, optimisé pour CPU

**Risque :** Légère perte de précision

**Si succès :** Mesurer le gain de temps et la qualité OCR

---

### Benchmark C : DPI 150 (si B insuffisant)

**Modification :**
```python
pix = page.get_pixmap(dpi=150)  # Au lieu de 200
```

**Pourquoi :** Réduction de la taille des images

**Risque :** Légère perte de précision sur les petits caractères

**Si succès :** Mesurer le gain de temps et la qualité OCR

---

### Benchmark D : enable_mkldnn=True + PP-OCRv5_mobile (si B succès)

**Modification :**
```python
enable_mkldnn=True,
text_detection_model_name="PP-OCRv5_mobile_det",
text_recognition_model_name="PP-OCRv5_mobile_rec",
```

**Pourquoi :** Combinaison des deux optimisations

**Risque :** Peut crasher + perte de précision

**Si succès :** Mesurer le gain de temps cumulé

---

## Proposition d'implémentation

### Étape 1 : Benchmark A (enable_mkldnn=True)

**Modification dans `text_extractor.py` ligne 81 :**
```python
# Avant
enable_mkldnn=False,

# Après
enable_mkldnn=True,
```

**Justification :** C'est le facteur le plus probable de lenteur

**Mesure :** Lancer le benchmark sur une page représentative

**Si crash :** Revenir à False et passer au Benchmark B

**Si succès :** Comparer le temps predict() avec la baseline

---

### Étape 2 : Benchmark B (PP-OCRv5_mobile) - SEULEMENT si A échoue

**Modification dans `text_extractor.py` lignes 76-77 :**
```python
# Avant
text_detection_model_name="PP-OCRv6_small_det",
text_recognition_model_name="PP-OCRv6_small_rec",

# Après
text_detection_model_name="PP-OCRv5_mobile_det",
text_recognition_model_name="PP-OCRv5_mobile_rec",
```

**Justification :** Modèle plus léger, optimisé pour CPU

**Mesure :** Lancer le benchmark sur une page représentative

**Comparaison :** Comparer le temps predict() avec la baseline

---

### Étape 3 : Benchmark C (DPI 150) - SEULEMENT si B insuffisant

**Modification dans `text_extractor.py` ligne 297 :**
```python
# Avant
pix = page.get_pixmap(dpi=200)

# Après
pix = page.get_pixmap(dpi=150)
```

**Justification :** Réduction de la taille des images

**Mesure :** Lancer le benchmark sur une page représentative

**Comparaison :** Comparer le temps predict() avec la baseline

---

## Conclusion

L'analyse du code montre que :

1. **enable_mkldnn=False** est probablement le facteur principal de lenteur
2. **PP-OCRv6_small** est déjà le modèle le plus léger de la série v6
3. **DPI 200** donne des images de résolution élevée
4. Les paramètres PaddleOCR sont déjà optimisés
5. Le preprocessing est déjà optimisé (0.3 s/page)

**Recommandation :** Commencer par le Benchmark A (enable_mkldnn=True), car c'est le facteur le plus probable de lenteur et le plus facile à tester.

**Voulez-vous que j'applique le Benchmark A (enable_mkldnn=True) maintenant ?**
