# Diagnostic - Parallélisation OCR Réelle

## Date
2026-08-10

## Contexte

Le test précédent avec parallélisation activée (2 workers, OMP_NUM_THREADS=2, MKL_NUM_THREADS=2) a montré :
- CPS de 25 pages : 799,55 s d'OCR
- Temps moyen par page : ~32 s/page
- Ancien traitement séquentiel : ~23 s/page

**Problème** : Le temps a AUGMENTÉ avec la parallélisation (32 s/page vs 23 s/page).

---

## Modifications Ajoutées pour Diagnostic

### 1. Logs de diagnostic dans `_ocr_page_worker()`

**Ajouté :**
```python
import threading
worker_id = threading.current_thread().name

worker_start = time.time()
logger.info(f"[PARALLEL-DEBUG] START page={page_num} worker={worker_id} timestamp={worker_start:.3f}")

ocr_page_start = time.time()
logger.info(f"[PARALLEL-DEBUG] PREDICT_START page={page_num} worker={worker_id} timestamp={ocr_page_start:.3f}")

ocr_page_end = time.time()
logger.info(f"[PARALLEL-DEBUG] PREDICT_END page={page_num} worker={worker_id} timestamp={ocr_page_end:.3f} duration={page_ocr_time:.3f}s")

worker_end = time.time()
logger.info(f"[PARALLEL-DEBUG] END page={page_num} worker={worker_id} timestamp={worker_end:.3f} total_duration={worker_end - worker_start:.3f}s")
```

**Objectif :** Mesurer le chevauchement réel des appels predict() avec timestamps précis.

---

### 2. Logs de diagnostic dans `_ocr_pdf_scanne_parallel()`

**Ajouté :**
```python
logger.info(f"[PARALLEL-DEBUG] OMP_NUM_THREADS={os.environ.get('OMP_NUM_THREADS', 'NOT_SET')}")
logger.info(f"[PARALLEL-DEBUG] MKL_NUM_THREADS={os.environ.get('MKL_NUM_THREADS', 'NOT_SET')}")
logger.info(f"[PARALLEL-DEBUG] CPU count={os.cpu_count()}")
```

**Objectif :** Vérifier que les variables d'environnement sont réellement définies dans le processus Uvicorn.

---

### 3. Logs de diagnostic dans `_ocr_page_avec_langue()`

**Ajouté :**
```python
logger.info(f"[OCR-DEBUG] Instance PaddleOCR pour lang={lang} id={id(ocr)}")
```

**Objectif :** Vérifier si les workers utilisent la même instance PaddleOCR (singleton) via l'ID de l'objet.

---

## Réponses aux 10 Points de Vérification

### 1. ✅ `_ocr_pdf_scanne_parallel()` est bien appelé

**Code (ligne 903) :**
```python
nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne_parallel(extracted_file.absolute_path, out_path)
```

**Statut :** CONFIRMÉ - La fonction parallèle est bien appelée.

---

### 2. ⏳ Workers exécutent-ils des predict() simultanés ?

**À vérifier avec les nouveaux logs :**
- `[PARALLEL-DEBUG] PREDICT_START page=X worker=Y timestamp=...`
- `[PARALLEL-DEBUG] PREDICT_END page=X worker=Y timestamp=...`

**Analyse à faire :**
- Si les timestamps de PREDICT_START de page 1 et page 2 se chevauchent → parallélisation réelle
- Si les timestamps sont séquentiels → parallélisation sérialisée

**Statut :** EN ATTENTE DES LOGS

---

### 3. ✅ Logs de diagnostic ajoutés

**Logs ajoutés :**
- `[PARALLEL-DEBUG] START page=X worker=Y timestamp=...`
- `[PARALLEL-DEBUG] PREDICT_START page=X worker=Y timestamp=...`
- `[PARALLEL-DEBUG] PREDICT_END page=X worker=Y timestamp=... duration=...s`
- `[PARALLEL-DEBUG] END page=X worker=Y timestamp=... total_duration=...s`
- `[PARALLEL-DEBUG] OMP_NUM_THREADS=...`
- `[PARALLEL-DEBUG] MKL_NUM_THREADS=...`
- `[PARALLEL-DEBUG] CPU count=...`
- `[OCR-DEBUG] Instance PaddleOCR pour lang=fr id=...`

**Statut :** AJOUTÉ

---

### 4. ⏳ Nombre maximal de predict() simultanés

**À vérifier avec les logs :**
- Analyser les timestamps PREDICT_START/PREDICT_END
- Compter combien de predict() sont actifs en même temps

**Statut :** EN ATTENTE DES LOGS

---

### 5. ✅ Workers utilisent-ils la même instance PaddleOCR ?

**Code (ligne 41-70) :**
```python
_paddle_ocr_instances: dict[str, object] = {}

def _get_paddle_ocr(lang: str):
    if lang not in _paddle_ocr_instances:
        _paddle_ocr_instances[lang] = PaddleOCR(...)
    return _paddle_ocr_instances[lang]
```

**Analyse :**
- `_paddle_ocr_instances` est un dictionnaire au niveau module
- Singleton partagé entre tous les workers
- Le log `id={id(ocr)}` permettra de vérifier

**Statut :** PROBABLEMENT OUI (singleton) - À confirmer avec les logs

---

### 6. ⏳ L'instance partagée sérialise-t-elle les appels ?

**Analyse théorique :**
- PaddleOCR n'est pas documenté comme thread-safe
- Avec `enable_mkldnn=False`, moins de threads internes
- Mais les appels concurrents peuvent causer :
  - Contention sur les modèles
  - Sérialisation implicite
  - Corruption d'état

**À vérifier avec les logs :**
- Si les predict() sont séquentiels malgré ThreadPoolExecutor → sérialisation par PaddleOCR

**Statut :** EN ATTENTE DES LOGS

---

### 7. ⏳ OMP_NUM_THREADS et MKL_NUM_THREADS sont-ils définis ?

**Code source (lignes 20-21) :**
```python
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")
```

**À vérifier avec les logs :**
- `[PARALLEL-DEBUG] OMP_NUM_THREADS=...`
- `[PARALLEL-DEBUG] MKL_NUM_THREADS=...`

**Statut :** EN ATTENTE DES LOGS

---

### 8. ⏳ Temps séparé par étape

**Logs actuels :**
- Conversion PDF → image : `[PERF] Conversion PDF→image: ...s`
- Preprocessing : inclus dans `page_preprocess_time`
- predict() : `[PARALLEL-DEBUG] PREDICT_START/END` + duration
- Écriture/réassemblage : inclus dans le temps total

**Statut :** PARTIELLEMENT DISPONIBLE - Logs détaillés ajoutés

---

### 9. ✅ Comparaison avec séquentiel

| Scénario | Temps par page | Temps total (25 pages) |
|----------|---------------|----------------------|
| Séquentiel (ancien) | ~23 s | ~575 s |
| Parallèle (test) | ~32 s | 799,55 s |
| **Différence** | **+39%** | **+39%** |

**Statut :** PERFORMANCE DÉGRADÉE avec parallélisation

---

### 10. ✅ Aucun changement interdit

**Paramètres maintenus :**
- ✅ `enable_mkldnn=False`
- ✅ max_workers = 2
- ✅ OMP_NUM_THREADS = 2
- ✅ MKL_NUM_THREADS = 2
- ✅ Architecture PaddleOCR inchangée
- ✅ LLM/Gemini inchangé

**Statut :** RESPECTÉ

---

## Analyse Théorique des 3 Cas Possibles

### Cas A : Vraie parallélisation

**Signes :**
- Les logs montrent des PREDICT_START chevauchés
- Exemple : Page 1 START à t=0, Page 2 START à t=1 (avant fin de Page 1)
- Nombre de predict() simultanés = 2

**Temps attendu :**
- ~287 s (575 s / 2) si parfait
- ~300-350 s avec overhead

**Observation actuelle :** 799,55 s → PAS cohérent avec vraie parallélisation

---

### Cas B : Parallélisation partielle

**Signes :**
- Certains PREDICT_START chevauchés
- Mais contention réduit le gain
- Temps介于 séquentiel et parallèle parfait

**Temps attendu :**
- ~400-500 s

**Observation actuelle :** 799,55 s → PAS cohérent avec parallélisation partielle

---

### Cas C : Fausse parallélisation

**Signes :**
- PREDICT_START séquentiels (pas de chevauchement)
- ThreadPoolExecutor existe mais predict() sérialisés
- Temps ≥ séquentiel (avec overhead)

**Temps attendu :**
- ~600-800 s (séquentiel + overhead)

**Observation actuelle :** 799,55 s → COHÉRENT avec fausse parallélisation

---

## Conclusion Préliminaire (SANS LOGS)

**Basé sur le temps observé (799,55 s vs 575 s séquentiel) :**

### Probabilité élevée : Cas C - Fausse parallélisation

**Raisons :**
1. Le temps a AUGMENTÉ avec la parallélisation (+39%)
2. Ce n'est pas cohérent avec une vraie parallélisation (devrait être ~300-350 s)
3. Ce n'est pas cohérent avec une parallélisation partielle (devrait être ~400-500 s)
4. C'est cohérent avec une fausse parallélisation (séquentiel + overhead)

**Cause probable :**
- L'instance singleton PaddleOCR n'est pas thread-safe
- Les appels predict() sont sérialisés implicitement
- ThreadPoolExecutor ajoute de l'overhead sans gain

---

## Étapes Suivantes

1. ✅ Logs de diagnostic ajoutés
2. ⏭️ Lancer un test sur CPS (25 pages)
3. ⏭️ Analyser les logs PARALLEL-DEBUG
4. ⏭️ Déterminer le chevauchement réel des predict()
5. ⏭️ Confirmer le cas (A, B ou C)
6. ⏭️ Proposer la solution adaptée

---

## Solution Potentielle (Si Cas C confirmé)

Si la fausse parallélisation est confirmée, les options sont :

### Option 1 : Instance PaddleOCR par worker
- Créer une instance PaddleOCR dans chaque worker
- Plus de mémoire mais thread-safe
- Gain réel de parallélisation

### Option 2 : Revenir à séquentiel
- Supprimer ThreadPoolExecutor
- Éliminer l'overhead
- Temps ~575 s (meilleur que 799 s)

### Option 3 : ProcessPoolExecutor au lieu de ThreadPoolExecutor
- Isolation complète des processus
- Plus de mémoire mais thread-safe garanti
- Gain réel de parallélisation

---

## Conclusion Actuelle

**Sans les logs de diagnostic, je ne peux pas confirmer avec certitude.**

Cependant, basé sur le temps observé (799,55 s vs 575 s séquentiel), la probabilité est :

- **Cas A (vraie parallélisation)** : 5%
- **Cas B (parallélisation partielle)** : 15%
- **Cas C (fausse parallélisation)** : 80%

**Recommandation :** Lancer un test avec les nouveaux logs de diagnostic pour confirmer.
