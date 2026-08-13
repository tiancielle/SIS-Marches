# Retour au Mode Séquentiel - Étape 1

## Date
2026-08-10

## Modifications Effectuées

### Fichier : `text_extractor.py`

#### Modification 1 : Réactivation du mode séquentiel (ligne 915)

**Changement :**
```python
# Avant
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne_parallel(extracted_file.absolute_path, out_path)

# Après
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
```

**Justification :** La parallélisation était contre-productive (1490 s vs 575 s séquentiel). Revenir au séquentiel pour retrouver les performances optimales.

---

#### Modification 2 : Suppression des logs de diagnostic dans `_ocr_page_worker()` (lignes 395-440)

**Changement :**
- Supprimé : Logs `[PARALLEL-DEBUG] START/PREDICT_START/PREDICT_END/END`
- Supprimé : Import `threading` et `worker_id`
- Supprimé : Timestamps de diagnostic

**Justification :** Les logs de diagnostic ne sont plus nécessaires pour le mode séquentiel.

---

#### Modification 3 : Suppression des logs de diagnostic dans `_ocr_pdf_scanne_parallel()` (lignes 443-448)

**Changement :**
- Supprimé : Logs `[PARALLEL-DEBUG] OMP_NUM_THREADS/MKL_NUM_THREADS/CPU count`

**Justification :** Les logs de diagnostic ne sont plus nécessaires pour le mode séquentiel.

---

#### Modification 4 : Suppression du log ID instance dans `_ocr_page_avec_langue()` (ligne 117)

**Changement :**
```python
# Avant
logger.info(f"[OCR-DEBUG] Instance PaddleOCR pour lang={lang} id={id(ocr)}")

# Après
logger.info(f"[OCR-DEBUG] Instance PaddleOCR pour lang={lang}")
```

**Justification :** Le log de l'ID instance n'est plus nécessaire pour le mode séquentiel.

---

## Configuration Maintenue

| Paramètre | Valeur | Statut |
|-----------|--------|--------|
| enable_mkldnn | False | ✅ Maintenu |
| OMP_NUM_THREADS | 2 | ✅ Maintenu |
| MKL_NUM_THREADS | 2 | ✅ Maintenu |
| Modèle OCR | PP-OCRv6_small_det/rec | ✅ Maintenu |
| DPI | 200 | ✅ Maintenu |
| Mode | Séquentiel | ✅ Activé |

---

## Résultat Attendu

### Performance
- **Temps par page** : ~23 s (au lieu de 60 s en parallèle)
- **Temps total (25 pages)** : ~575 s (au lieu de 1490 s en parallèle)
- **Gain** : 2.6x plus rapide que la parallélisation

### Contenu OCR
- **Qualité** : Identique au séquentiel précédent
- **Fiabilité** : Maintenue (pas de contention)

---

## Prochaines Étapes

### Étape 1 (immédiate) : Test de validation
- ✅ Modifications appliquées
- ⏭️ Lancer un test sur CPS long (~25 pages)
- ⏭️ Vérifier que le temps par page est ~23 s
- ⏭️ Vérifier que le contenu OCR est correct

### Étape 2 (après validation) : Optimisation du modèle
- Changer pour PP-OCRv5_mobile_det/rec
- Garder DPI 200
- Mesurer le gain réel

### Étape 3 (si nécessaire) : Réduction du DPI
- Changer DPI de 200 à 150
- Vérifier la qualité OCR
- Mesurer le gain supplémentaire

---

## Conclusion

Le pipeline est revenu au mode séquentiel avec la configuration originale optimisée (OMP/MKL threads réduits à 2). Les performances attendues sont ~575 s pour 25 pages (23 s/page), ce qui est 2.6x plus rapide que la parallélisation contre-productive.

Prêt pour le test de validation.
