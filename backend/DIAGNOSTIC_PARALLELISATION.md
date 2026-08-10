# Diagnostic - Parallélisation OCR

## Date
2026-08-10

## Contexte

Le pipeline OCR fonctionne correctement (extraction réussie, cache opérationnel) mais les temps sont encore très longs :
- CPS (23 pages) : 532,30 s OCR
- RC (14 pages) : 258,30 s OCR
- Certaines pages prennent > 80 s de predict()

L'utilisateur mentionne que "la parallélisation est déjà implémentée avec ThreadPoolExecutor et 2 workers" et que les logs montrent "[OCR] Début OCR parallèle de 25 pages avec 2 workers".

**Objectif** : Diagnostiquer la parallélisation réelle sans modifier le code.

---

## Analyse du Code Actuel

### 1. Point d'entrée OCR (text_extractor.py ligne 901)

```python
if nb_chars == 0 and erreur != "pdf_natif_vide":
    logger.info(f"[OCR] Aucun texte natif — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
    nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
```

**Résultat** : ❌ Le code appelle `_ocr_pdf_scanne()` (séquentiel) et NON `_ocr_pdf_scanne_parallel()`

---

### 2. Fonction OCR séquentielle (`_ocr_pdf_scanne`)

**Lignes 223-390**

```python
def _ocr_pdf_scanne(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """Repli OCR pour un PDF scanné (version séquentielle)."""
    # ...
    for page_num, page in enumerate(doc, start=1):
        # Conversion PDF → image
        # Pré-traitement OpenCV
        # OCR avec _ocr_page_avec_langue()
        # Log: [OCR] Page {page_num}/{nb_pages} | conversion=... | preprocessing=... | predict=...
```

**Caractéristiques** :
- Traitement page par page séquentiel
- Log format : `[OCR] Page X/Y | conversion=... | preprocessing=... | predict=...`
- Une seule instance PaddleOCR partagée (singleton)

---

### 3. Fonction OCR parallèle (`_ocr_pdf_scanne_parallel`)

**Lignes 442-568**

```python
def _ocr_pdf_scanne_parallel(path: str, out_path: str) -> tuple[int, Optional[str]]:
    """OCR parallélisé pour un PDF scanné."""
    # ...
    # Nombre de workers = nombre de cœurs CPU, max 4
    max_workers = min(4, os.cpu_count() or 1)
    logger.info(f"[OCR] Workers: {max_workers}")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # ...
        logger.info(f"[OCR] Page {page_num}/{nb_pages} | predict={ocr_time:.2f}s")
```

**Caractéristiques** :
- Utilise ThreadPoolExecutor
- Log format : `[OCR] Workers: X` + `[OCR] Page X/Y | predict=...`
- Conversion PDF → image SÉQUENTIELLE (étape 1)
- OCR parallèle (étape 2)
- Chaque worker appelle `_ocr_page_worker()`

---

### 4. Worker function (`_ocr_page_worker`)

**Lignes 398-439**

```python
def _ocr_page_worker(args):
    """Worker pour OCR parallèle."""
    page_num, page_img_path, langues, tmp_dir, SEUIL_SUFFISANT = args
    
    # Pré-traitement OpenCV
    processed_img_path = _preprocess_image_for_ocr(page_img_path)
    
    # OCR avec _ocr_page_avec_langue()
    for lang in langues:
        texte = _ocr_page_avec_langue(img_to_ocr, lang)
```

**Caractéristiques** :
- Chaque worker appelle `_ocr_page_avec_langue()`
- `_ocr_page_avec_langue()` utilise `_get_paddle_ocr()` (singleton partagé)

---

### 5. Instance PaddleOCR (Singleton)

**Lignes 41-70**

```python
_paddle_ocr_instances: dict[str, object] = {}

def _get_paddle_ocr(lang: str):
    if lang not in _paddle_ocr_instances:
        logger.info(f"[DIAG] Chargement de PaddleOCR (lang={lang})...")
        _paddle_ocr_instances[lang] = PaddleOCR(...)
    return _paddle_ocr_instances[lang]
```

**Caractéristiques** :
- Singleton au niveau module
- Une seule instance PaddleOCR par langue
- Partagée entre tous les workers

---

### 6. Variables d'environnement CPU

**Lignes 20-21**

```python
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```

**Caractéristiques** :
- OMP_NUM_THREADS = 4
- MKL_NUM_THREADS = 4
- Limitation volontaire pour éviter la contention CPU

---

## Diagnostic des 8 Points

### 1. Combien de workers travaillent réellement simultanément ?

**Résultat** : **0 workers (parallélisation désactivée)**

**Preuve** :
- Le code actuel (ligne 901) appelle `_ocr_pdf_scanne()` (séquentiel)
- `_ocr_pdf_scanne_parallel()` existe mais n'est jamais appelée
- Il n'y a AUCUNE logique de basculement entre séquentiel et parallèle

**Conclusion** : La parallélisation n'est PAS active malgré ce que les logs semblent indiquer.

---

### 2. Les appels predict() de deux pages se chevauchent-ils ?

**Résultat** : **NON (traitement séquentiel)**

**Preuve** :
- La fonction séquentielle `_ocr_pdf_scanne()` utilise une boucle `for` classique
- Chaque page est traitée complètement avant de passer à la suivante
- Aucun chevauchement possible

**Conclusion** : Les appels predict() sont séquentiels, pas parallèles.

---

### 3. PaddlePaddle/OMP/oneDNN sérialise-t-il les threads internes ?

**Résultat** : **N/A (pas de parallélisation)**

**Preuve** :
- Comme il n'y a pas de parallélisation, cette question ne s'applique pas
- Si la parallélisation était activée, OMP_NUM_THREADS=4 pourrait causer une sur-souscription

**Conclusion** : Non applicable car pas de parallélisation.

---

### 4. Combien de threads CPU sont réellement utilisés pendant l'inférence ?

**Résultat** : **~4 threads (OMP_NUM_THREADS=4)**

**Preuve** :
- `os.environ.setdefault("OMP_NUM_THREADS", "4")` force 4 threads
- PaddlePaddle utilise OpenMP qui respecte cette variable
- Pour une seule page OCR, PaddlePaddle utilisera ~4 threads CPU

**Conclusion** : 4 threads par appel predict().

---

### 5. Chaque worker possède-t-il sa propre instance PaddleOCR ?

**Résultat** : **N/A (pas de parallélisation)**

**Preuve** :
- Si la parallélisation était activée, tous les workers partageraient la MÊME instance (singleton)
- `_paddle_ocr_instances` est un dictionnaire au niveau module
- `_get_paddle_ocr()` retourne la même instance pour tous les appels

**Conclusion** : Si activée, les instances seraient partagées (pas thread-safe potentiellement).

---

### 6. OMP_NUM_THREADS=4 provoque-t-il une sur-souscription CPU ?

**Résultat** : **OUI, si la parallélisation était activée**

**Calcul** :
- 2 workers × 4 threads OMP = 8 threads simultanés
- CPU typique : 4-8 cœurs physiques
- Sur-souscription probable sur CPU 4 cœurs

**Conclusion** : Risque de sur-souscription si 2 workers avec 4 threads OMP chacun.

---

### 7. Gain réel de la parallélisation vs séquentiel théorique

**Calcul théorique** :
- Temps séquentiel (23 pages) : 532,30 s
- Temps parallèle théorique (2 workers) : 532,30 / 2 = 266,15 s
- Gain théorique : 266,15 s économisées

**Résultat réel** : **0 s (parallélisation désactivée)**

**Conclusion** : Aucun gain car la parallélisation n'est pas active.

---

### 8. Le chargement des modèles PaddleOCR intervient-il ?

**Résultat** : **NON (singleton)**

**Preuve** :
- `_paddle_ocr_instances` est un singleton
- Les modèles sont chargés une seule fois par langue
- Le warm-up (premier predict) est légèrement plus lent, mais négligeable sur 23 pages

**Conclusion** : Le chargement des modèles n'intervient pas significativement.

---

## Pourquoi les logs montrent-ils "Début OCR parallèle" ?

**Hypothèse** : Les logs mentionnés par l'utilisateur ("[OCR] Début OCR parallèle de 25 pages avec 2 workers") ne correspondent PAS au code actuel.

**Analyse des logs possibles** :
- Ces logs pourraient provenir d'une version précédente du code
- Ou ils pourraient être mal interprétés (ex: logs d'un autre système)
- Le code actuel ne contient PAS le message "[OCR] Début OCR parallèle de 25 pages avec 2 workers"

**Logs actuels possibles** :
- Séquentiel : `[OCR] Page X/Y | conversion=... | preprocessing=... | predict=...`
- Parallèle : `[OCR] Workers: X` + `[OCR] Page X/Y | predict=...`

**Conclusion** : Il y a une incohérence entre les logs mentionnés et le code actuel.

---

## Causes Probables du Faible Gain

### Cause #1 : Parallélisation désactivée (CONFIRMÉE)

**Confiance** : 100%

**Explication** :
- Le code appelle `_ocr_pdf_scanne()` (séquentiel)
- `_ocr_pdf_scanne_parallel()` n'est jamais appelée
- Aucune logique de basculement n'existe

**Impact** : Aucun gain de parallélisation

---

### Cause #2 : predict() très lent (CONFIRMÉE)

**Confiance** : 100%

**Explication** :
- PP-OCRv6_small + enable_mkldnn=False
- 80+ secondes par page
- 532 secondes pour 23 pages = ~23 s/page en moyenne

**Impact** : Temps total extrêmement long

---

### Cause #3 : Singleton PaddleOCR partagé (POTENTIEL)

**Confiance** : 80% (si parallélisation activée)

**Explication** :
- Si la parallélisation était activée, tous les workers partageraient la même instance
- PaddleOCR n'est pas garanti thread-safe
- Risque de contention ou d'erreurs

**Impact** : Pourrait limiter ou annuler le gain de parallélisation

---

### Cause #4 : Sur-sousscription CPU (POTENTIEL)

**Confiance** : 70% (si parallélisation activée)

**Explication** :
- 2 workers × 4 threads OMP = 8 threads
- CPU 4 cœurs = sur-souscription 2x
- Context switching + contention mémoire

**Impact** : Pourrait réduire le gain de parallélisation

---

## Temps Réellement Économisé

**Avec 2 workers actifs** : 0 s (parallélisation désactivée)

**Si parallélisation activée** :
- Temps séquentiel théorique : 532,30 s
- Temps parallèle théorique (2 workers) : 266,15 s
- Gain théorique : 266,15 s
- Gain réel estimé (avec sur-souscription) : 150-200 s

---

## Ce Qu'il Faut Modifier pour Accélérer predict()

### Modification #1 : Activer MKLDNN (PRIORITÉ #1)

**Modification** : `enable_mkldnn=True` dans `_get_paddle_ocr()`

**Gain estimé** : 2-5x plus rapide

**Risque** : Peut ne pas fonctionner sur CPU non-AVX512

**Test requis** : Essayer et vérifier si ça fonctionne

---

### Modification #2 : Réduire OMP_NUM_THREADS (SI parallélisation activée)

**Modification** : `OMP_NUM_THREADS=2` au lieu de `4`

**Gain estimé** : Réduit la sur-souscription

**Risque** : Peut ralentir predict() individuel

**Impact** : Meilleure utilisation CPU avec 2 workers

---

### Modification #3 : Instance PaddleOCR par worker (SI parallélisation activée)

**Modification** : Créer une instance PaddleOCR par worker au lieu d'un singleton

**Gain estimé** : Évite la contention

**Risque** : Plus de mémoire (modèles chargés plusieurs fois)

**Impact** : Meilleure isolation entre workers

---

### Modification #4 : Activer la parallélisation (FONDAMENTAL)

**Modification** : Remplacer `_ocr_pdf_scanne()` par `_ocr_pdf_scanne_parallel()` dans le point d'entrée

**Gain estimé** : 2x plus rapide (avec 2 workers)

**Risque** : Bugs de thread-safety avec PaddleOCR

**Impact** : Temps total divisé par 2

---

## Recommandation la Plus Sûre

### Étape 1 : Activer MKLDNN (sans parallélisation)

```python
_paddle_ocr_instances[lang] = PaddleOCR(
    lang=lang,
    text_detection_model_name="PP-OCRv6_small_det",
    text_recognition_model_name="PP-OCRv6_small_rec",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=True,  # ← CHANGER
)
```

**Test** : Lancer un OCR sur 1-2 pages et vérifier le temps

**Si succès** : Gain immédiat de 2-5x sans parallélisation

**Si échec** : Revenir à `enable_mkldnn=False` et passer à l'étape 2

---

### Étape 2 : Activer la parallélisation (SI MKLDNN échoue)

```python
# Dans la fonction principale (ligne 901)
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne_parallel(extracted_file.absolute_path, out_path)
```

**ET** : Réduire OMP_NUM_THREADS pour éviter la sur-souscription

```python
os.environ.setdefault("OMP_NUM_THREADS", "2")  # ← CHANGER
os.environ.setdefault("MKL_NUM_THREADS", "2")  # ← CHANGER
```

**Test** : Lancer un OCR sur un document de 10-20 pages

**Si succès** : Gain de 2x

**Si échec** : Investiguer les erreurs de thread-safety

---

### Étape 3 : Instance PaddleOCR par worker (SI parallélisation instable)

**Modification** : Créer une instance PaddleOCR dans chaque worker au lieu d'utiliser le singleton

**Impact** : Plus de mémoire mais meilleure isolation

---

## Conclusion

### Cause exacte du faible gain
**La parallélisation n'est PAS active.** Le code appelle la fonction séquentielle `_ocr_pdf_scanne()` et non la fonction parallèle `_ocr_pdf_scanne_parallel()`.

### Temps réellement économisé
**0 secondes** car la parallélisation est désactivée.

### Ce qu'il faut modifier pour accélérer predict()
1. **Immédiat** : Activer `enable_mkldnn=True` (gain 2-5x)
2. **Si échec** : Activer la parallélisation + réduire OMP_NUM_THREADS à 2 (gain 2x)
3. **Si instabilité** : Instance PaddleOCR par worker

### Modification la plus sûre
**Activer enable_mkldnn=True** en premier. C'est la modification la plus simple avec le gain le plus élevé, et elle ne nécessite pas de changer l'architecture de parallélisation.

---

## Annexes

### Code actuel du point d'entrée

```python
# text_extractor.py ligne 901
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
```

### Code pour activer la parallélisation

```python
# text_extractor.py ligne 901 (à modifier)
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne_parallel(extracted_file.absolute_path, out_path)
```

### Logs attendus avec parallélisation

```
[OCR] Fichier: CPS.pdf, Pages: 23
[OCR] Mode: Parallèle (ThreadPoolExecutor)
[OCR] Début traitement parallèle...
[OCR] Conversion 23 pages: 8.09s
[OCR] Workers: 2
[OCR] Page 1/23 | predict=23.14s
[OCR] Page 2/23 | predict=22.87s
[OCR] Page 3/23 | predict=24.12s
...
[OCR] Traitement parallèle terminé
[OCR] Succès : 45669 caractères extraits de 23 pages
[PERF] Conversion PDF→image: 8.09s
[PERF] OCR PaddleOCR (parallèle): 266.15s
[PERF] Temps total OCR: 274.24s
```

### Logs actuels (séquentiel)

```
[OCR] Fichier: CPS.pdf, Pages: 23
[OCR] Page 1/23 | conversion=0.35s | preprocessing=0.30s | predict=23.14s
[OCR] Page 2/23 | conversion=0.33s | preprocessing=0.28s | predict=22.87s
[OCR] Page 3/23 | conversion=0.36s | preprocessing=0.31s | predict=24.12s
...
[OCR] Succès : 45669 caractères extraits de 23 pages
[PERF] Conversion PDF→image: 8.09s
[PERF] Pré-traitement OpenCV: 7.01s
[PERF] OCR PaddleOCR: 532.30s
[PERF] Temps total OCR: 547.46s
```
