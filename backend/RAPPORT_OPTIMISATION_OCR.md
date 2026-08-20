# Rapport d'Optimisation OCR

## Date
2026-08-18

## Objectif
Optimiser le temps d'OCR pour les documents PDF scannés (CPS) en utilisant PaddleOCR sur CPU, sans dégrader la qualité de l'extraction.

## Problème Initial
- **Temps predict()** : 20-80 secondes par page
- **Temps total OCR** : Plusieurs minutes pour un CPS de 20-70 pages
- **Variabilité extrême** : Contention CPU et overhead de parallélisation

## Optimisations Appliquées

### 1. Réutilisation de l'instance PaddleOCR par worker ✅
**Problème** : Chaque worker recréait l'instance PaddleOCR pour chaque page (~5-10s de coût d'initialisation)

**Solution** : 
- Ajout d'un initializer ProcessPoolExecutor
- Chaque worker crée l'instance PaddleOCR une seule fois
- Réutilise l'instance pour toutes ses pages

**Fichier modifié** : `text_extractor.py`
- Ligne 591-618 : Ajout de `_worker_initializer()` et variable globale `_worker_ocr_instance`
- Ligne 637-642 : Modification de `_ocr_page_worker()` pour utiliser l'instance globale
- Ligne 788 : Ajout de `initializer=_worker_initializer` au ProcessPoolExecutor

**Résultat** : Validé - fonctionne correctement

---

### 2. Réduction du nombre de workers (2 → 1) ✅
**Problème** : 2 workers × 2 threads OMP = 4 threads sur CPU 4 cœurs = sur-sousscription et contention

**Solution** :
- Réduction de `max_workers` de 2 à 1
- 1 worker × 2 threads OMP = 2 threads = meilleur équilibre

**Fichier modifié** : `text_extractor.py`
- Ligne 798 : `max_workers = 1` (au lieu de `min(2, os.cpu_count() or 1)`)

**Résultat** :
- Gain de performance : -18% sur predict() (22s → 18s/page)
- Stabilité améliorée (variance réduite)
- Qualité OCR : Maintenue (pas de dégradation)

---

### 3. Suppression des logs diagnostiques OCR-DEBUG ✅
**Problème** : Les logs `[OCR-DEBUG]` ajoutaient une surcharge de performance

**Solution** :
- Suppression des logs diagnostiques pour réduire l'overhead I/O

**Fichier modifié** : `text_extractor.py`
- Ligne 674-718 : Suppression des logs `[OCR-DEBUG]`

**Résultat** : Code nettoyé, overhead réduit

---

## Optimisations Testées et Rejetées

### 1. Réduction DPI (200 → 150) ❌
**Test** : Réduction de la résolution de 200 DPI à 150 DPI

**Résultat** :
- Gain de performance : -26% (30s → 22s/page)
- **Qualité OCR** : Dégradée de 37% (2000 → 1265 caractères/page)
- **Pages critiques** : Certaines pages passaient de ~2000 caractères à 6-10 caractères

**Décision** : REJETÉ - Le gain de performance ne justifie pas la perte de qualité

---

### 2. Activation MKLDNN ❌
**Test** : `enable_mkldnn=True`

**Résultat** :
- **Erreur** : `ConvertPirAttribute2RuntimeAttribute not support [pir::ArrayAttribute<pir::DoubleAttribute>]`
- **Incompatibilité** : MKLDNN n'est pas compatible avec la version de PaddlePaddle installée

**Décision** : ABANDONNÉ - Configuration définitive : `enable_mkldnn=False`

---

### 3. Cache contexte/analyse ❌
**Test** : Ajout de hash pour détecter les changements de contexte et réutiliser l'analyse LLM

**Résultat** :
- **Erreur** : Migration de base de données échouée (colonnes `contexte_hash`, `analyse_hash`)
- **Risque** : Casser le schéma existant de la base de données

**Décision** : ANNULÉ - Pour éviter de casser le schéma existant

---

## Configuration Finale OCR

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| **Workers** | 1 | Meilleur équilibre CPU, réduit la contention |
| **DPI** | 200 | Maintient la qualité OCR optimale |
| **MKLDNN** | False | Incompatible avec PaddlePaddle installé |
| **Modèle** | PP-OCRv6_small_det/rec | Équilibré qualité/vitesse |
| **OMP_NUM_THREADS** | 2 | Compatible avec 1 worker |
| **Cache OCR** | Activé | Fonctionnel et réutilisé |

---

## Performance Finale

### Avant optimisations
- **Temps predict()** : 20-80s/page (moyenne ~30s)
- **Variabilité** : Très élevée (17-75s)
- **Parallélisme** : 2 workers avec contention

### Après optimisations
- **Temps predict()** : 8-29s/page (moyenne ~18s)
- **Variabilité** : Réduite (plus stable)
- **Parallélisme** : 1 worker, sans contention
- **Gain total** : -40% sur predict() (30s → 18s/page)
- **Qualité OCR** : Maintenue (pas de dégradation)

---

## Recalculs Inutiles (Statut actuel)

| Étape | Comportement | Recalcul inutile ? |
|-------|-------------|-------------------|
| ZIP/Décompression | SKIP si déjà disponible | ❌ Non - optimisé |
| Extraction texte | Réutilise .txt si existe | ❌ Non - optimisé |
| OCR Cache | Vérifie cache avant OCR | ❌ Non - optimisé |
| Contexte LLM | Régénéré à chaque relance | ✅ OUI - recalcul inutile |
| Analyse LLM | Recalculée si statut ≠ "complete" | ✅ OUI - recalcul inutile |

**Note** : L'optimisation du cache contexte/analyse a été tentée mais annulée pour éviter de casser le schéma de base de données.

---

## Architecture Validée

### Workers
- **1 worker ProcessPool** : Évite la contention CPU
- **1 instance PaddleOCR par worker** : Réutilisée pour toutes les pages
- **Oui** : Fonctionne correctement

### Pipeline
- **Détection documents** : Fonctionnelle
- **Détection CPS** : Fonctionnelle
- **Extraction native** : Fonctionnelle
- **OCR** : Optimisé (18s/page)
- **Cache OCR** : Fonctionnel
- **Verrou d'analyse** : Corrigé (libération après exception)

---

## Limitations

### CPU non-AVX512
- Le CPU ne supporte pas AVX512, ce qui limite l'efficacité des optimisations matérielles
- MKLDNN est incompatible avec le PaddlePaddle installé

### Modèle lourd
- PP-OCRv6_small est optimisé pour la précision, pas la vitesse
- Passer à un modèle plus léger (mobile) pourrait améliorer la vitesse mais dégrader la qualité

### Backend CPU pur
- PaddleOCR sans MKLDNN fait l'inférence purement en logiciel
- L'accélération matérielle (GPU/TPU) n'est pas disponible

---

## Recommandations Futures

Si des optimisations supplémentaires sont nécessaires :

1. **Tester PP-OCRv5_mobile** : Modèle plus léger, potentiellement 60-80% plus rapide
2. **GPU/TPU** : Utiliser un backend GPU pour accélérer l'inférence
3. **Cloud OCR** : Utiliser un service OCR cloud (Google Vision, AWS Textract) pour les gros volumes
4. **Pré-indexation** : Pré-OCR les CPS pendant la phase de téléchargement (asynchrone)

---

## Conclusion

Les optimisations appliquées ont réduit le temps predict() de **40%** (30s → 18s/page) **sans dégrader la qualité OCR**. L'architecture actuelle est stable et fonctionnelle, mais les limites du CPU imposent des contraintes qui ne peuvent être surmontées sans changement d'infrastructure (GPU/TPU) ou de modèle.
