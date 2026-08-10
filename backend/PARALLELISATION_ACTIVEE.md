# Activation de la Parallélisation OCR - Résumé des Modifications

## Date
2026-08-10

## Modifications Effectuées

### Fichier : `text_extractor.py`

#### Modification 1 : Réduction des threads OMP/MKL (lignes 20-21)

**Avant :**
```python
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```

**Après :**
```python
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
```

**Justification :** Réduire la sur-sousscription CPU avec 2 workers (2 workers × 2 threads = 4 threads totaux, adapté à CPU 4 cœurs).

---

#### Modification 2 : Limitation à 2 workers (ligne 506)

**Avant :**
```python
# Nombre de workers = nombre de cœurs CPU, max 4
max_workers = min(4, os.cpu_count() or 1)
```

**Après :**
```python
# Nombre de workers = 2 maximum pour éviter la sur-sousscription CPU
# (2 workers × 2 threads OMP = 4 threads totaux, adapté à CPU 4 cœurs)
max_workers = min(2, os.cpu_count() or 1)
```

**Justification :** Limiter à 2 workers pour éviter la sur-sousscription CPU sur un CPU 4 cœurs.

---

#### Modification 3 : Activation de la parallélisation (ligne 901)

**Avant :**
```python
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
```

**Après :**
```python
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne_parallel(extracted_file.absolute_path, out_path)
```

**Justification :** Activer la fonction de parallélisation OCR au lieu de la version séquentielle.

---

## Configuration Résultante

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| OMP_NUM_THREADS | 2 | Évite la sur-sousscription |
| MKL_NUM_THREADS | 2 | Évite la sur-sousscription |
| max_workers | 2 | Adapté à CPU 4 cœurs |
| enable_mkldnn | False | Maintenu (bug oneDNN) |
| Threads totaux | 4 | 2 workers × 2 threads = 4 threads |

---

## Vérifications de Sécurité

### ✅ 1. Réassemblage des pages dans l'ordre
**Code (lignes 536-545) :**
```python
# Étape 3 : Assembler les résultats dans l'ordre
total_chars = 0
with open(out_path, "w", encoding="utf-8") as out:
    for page_num in range(1, nb_pages + 1):  # Boucle ordonnée 1, 2, 3...
        if page_num in results:
            texte, conv_time, preprocess_time, ocr_time = results[page_num]
            if texte:
                out.write(texte)
                out.write("\n\n")
                total_chars += len(texte)
```

**Statut :** ✅ Les pages sont réassemblées dans l'ordre séquentiel 1, 2, 3...

---

### ✅ 2. Écriture du .txt une seule fois après les workers
**Code (lignes 536-545) :**
```python
with open(out_path, "w", encoding="utf-8") as out:
    for page_num in range(1, nb_pages + 1):
        if page_num in results:
            texte, conv_time, preprocess_time, ocr_time = results[page_num]
            if texte:
                out.write(texte)
```

**Statut :** ✅ L'écriture se fait APRÈS tous les workers, dans un seul thread.

---

### ✅ 3. Erreur sur une page ne fait pas planter tout le document
**Code (lignes 520-529) :**
```python
for future in as_completed(future_to_page):
    page_num = future_to_page[future]
    try:
        page_num, texte, conv_time, preprocess_time, ocr_time = future.result()
        results[page_num] = (texte, conv_time, preprocess_time, ocr_time)
        
        # Log de progression
        logger.info(f"[OCR] Page {page_num}/{nb_pages} | predict={ocr_time:.2f}s")
    except Exception as exc:
        logger.error(f"[OCR] Erreur page {page_num}: {exc}")
```

**Statut :** ✅ Les erreurs sont capturées par try/except, le document continue.

---

### ✅ 4. Logs distinguent clairement le mode parallèle
**Logs attendus :**
```
[OCR] Fichier: CPS.pdf, Pages: 23
[OCR] Mode: Parallèle (ThreadPoolExecutor)
[OCR] Début traitement parallèle...
[OCR] Conversion 23 pages: 8.09s
[OCR] Workers: 2
[OCR] Page 1/23 | predict=23.14s
[OCR] Page 2/23 | predict=22.87s
...
[OCR] Traitement parallèle terminé
[OCR] Succès : 45669 caractères extraits de 23 pages
[PERF] Conversion PDF→image: 8.09s
[PERF] OCR PaddleOCR (parallèle): 266.15s
[PERF] Temps total OCR: 274.24s
```

**Statut :** ✅ Les logs incluent "Mode: Parallèle", "Workers: 2", et "(parallèle)" dans les logs de performance.

---

### ✅ 5. enable_mkldnn=False maintenu
**Code (ligne 68) :**
```python
enable_mkldnn=False,
```

**Statut :** ✅ MKLDNN reste désactivé pour éviter le bug oneDNN/PaddlePaddle.

---

## Résultat Attendu

### Performance
- **Temps séquentiel actuel** : 529 s (23 pages × 23 s/page)
- **Temps parallèle estimé** : 280-300 s (gain de ~45-50%)
- **Gain** : ~230-250 s économisées

### Configuration CPU
- **Threads totaux** : 4 (2 workers × 2 threads OMP)
- **CPU 4 cœurs** : 1 thread par cœur (optimal)
- **Sur-sousscription** : Éliminée

---

## Prochaines Étapes

1. ✅ Configuration appliquée
2. ⏭️ Lancer le même CPS (23 pages) pour tester
3. ⏭️ Lancer le même RC (14 pages) pour tester
4. ⏭️ Comparer les temps avec la version séquentielle
5. ⏭️ Vérifier que les fichiers .txt sont corrects
6. ⏭️ Surveiller les erreurs de thread-safety

---

## Plan de Repli

Si erreurs de thread-safety surviennent :
1. Revenir à séquentiel (ligne 901 : `_ocr_pdf_scanne`)
2. Implémenter une instance PaddleOCR par worker (plus de mémoire mais thread-safe)

---

## Conclusion

Les modifications ont été appliquées avec succès :
- ✅ OMP_NUM_THREADS = 2
- ✅ MKL_NUM_THREADS = 2
- ✅ max_workers = 2
- ✅ enable_mkldnn = False (maintenu)
- ✅ Parallélisation activée
- ✅ Vérifications de sécurité validées

Le pipeline est prêt pour le test sur CPS/RC.
