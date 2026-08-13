# Benchmark A - enable_mkldnn=True - Configuration

## Date
2026-08-10

## Modification Effectuée

### Fichier : `text_extractor.py` (ligne 81)

**Changement :**
```python
# Avant
enable_mkldnn=False,

# Après
enable_mkldnn=True,
```

---

## Configuration Actuelle

| Paramètre | Valeur | Statut |
|-----------|--------|--------|
| OMP_NUM_THREADS | 4 | ✅ Maintenu |
| MKL_NUM_THREADS | 4 | ✅ Maintenu |
| enable_mkldnn | True | ✅ Modifié |
| Modèle OCR | PP-OCRv6_small_det/rec | ✅ Maintenu |
| DPI | 200 | ✅ Maintenu |
| Mode | Séquentiel | ✅ Maintenu |

---

## Script de Benchmark Créé

### Fichier : `scripts/debug/benchmark_mkldnn_single_page.py`

**Fonction :** Benchmark enable_mkldnn=True sur une seule page représentative du CPS

**Usage :**
```bash
python scripts/debug/benchmark_mkldnn_single_page.py <chemin_fichier_pdf> [num_page]
```

**Exemple :**
```bash
python scripts/debug/benchmark_mkldnn_single_page.py /path/to/CPS.pdf 6
```

**Ce que le script mesure :**
1. Conversion PDF → image (DPI 200)
2. Dimensions de l'image
3. Initialisation de PaddleOCR (enable_mkldnn=True)
4. Temps predict() sur la page spécifiée
5. Nombre de blocs OCR et caractères extraits
6. Comparaison avec la baseline (~28.29 s pour page 6)

---

## Baseline

**Configuration précédente (enable_mkldnn=False) :**
- Page 6 : predict() = 28.29 s
- Temps moyen : 22.33 s/page
- Conversion : ~0.3-0.4 s/page
- Preprocessing : ~0.3 s/page

---

## Protocole de Test

### Option 1 : Utiliser le script de benchmark

```bash
cd C:\Users\nasri\OneDrive\Desktop\Projects\SIS_Marches\backend
python scripts/debug/benchmark_mkldnn_single_page.py <chemin_fichier_CPS.pdf> 6
```

### Option 2 : Tester avec le pipeline complet

1. Relancer le backend avec la nouvelle configuration
2. Lancer le même CPS de 14 pages
3. Récupérer les logs pour la page 6
4. Comparer le temps predict() avec la baseline

---

## Résultats Attendus

### Si enable_mkldnn=True fonctionne
- PaddleOCR démarre correctement
- predict() est significativement plus rapide que 28.29 s
- Le texte extrait est de qualité comparable
- **Action :** Tester sur les 14 pages complètes

### Si enable_mkldnn=True crash
- PaddleOCR crash au démarrage ou pendant predict()
- Erreur oneDNN ou PaddlePaddle
- **Action :** Revenir à enable_mkldnn=False et passer au Benchmark B (PP-OCRv5_mobile)

---

## Plan de Contingence

### Si enable_mkldnn=True crash
1. Revenir à enable_mkldnn=False
2. Passer au Benchmark B : PP-OCRv5_mobile
3. Modifier les modèles en :
   ```python
   text_detection_model_name="PP-OCRv5_mobile_det",
   text_recognition_model_name="PP-OCRv5_mobile_rec",
   ```

### Si enable_mkldnn=True fonctionne mais gain faible
1. Conserver enable_mkldnn=True
2. Passer au Benchmark C : DPI 150
3. Modifier le DPI en :
   ```python
   pix = page.get_pixmap(dpi=150)
   ```

---

## Conclusion

La modification enable_mkldnn=True a été appliquée. Un script de benchmark a été créé pour tester sur une seule page représentative (page 6).

**Prêt pour le test.** Vous pouvez lancer le script ou tester avec le pipeline complet et me fournir les résultats.

**Si enable_mkldnn=True crash, dites-le-moi immédiatement et je reviendrai à False.**
