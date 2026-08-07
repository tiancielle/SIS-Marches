# Audit d'Architecture - Pipeline DCE

## 1. Diagramme du Pipeline Réel

```
┌─────────────────────────────────────────────────────────────────┐
│                    DÉBUT - run_pipeline()                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Verrouillage (Lock)   │ ← Garde de concurrence par AO
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Court-circuit si     │ ← Si statut=="complete" et !force
                    │ statut=="complete"   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Téléchargement ZIP   │ ← Si url_cps vide
                    │ download_dce_for()   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Dézippage ZIP        │ ← extract_zip()
                    │ zip_extractor.py     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Indexation Documents │ ← index_documents()
                    │ document_indexer.py  │ ← SUPPRIME TOUS les DceDocument
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Extraction Texte     │ ← extract_text() pour CHAQUE fichier
                    │ text_extractor.py    │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ PDF natif        │  │ PDF scanné       │
        │ _ocr_pdf_natif() │  │ _ocr_pdf_scanne()│
        └──────────────────┘  └──────────────────┘
                                      │
                                      ▼
                           ┌──────────────────┐
                           │ Cache OCR        │ ← get_cached_ocr_result()
                           │ ocr_cache.py     │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ PaddleOCR        │ ← _ocr_page_avec_langue()
                           │ predict()        │ ← Instance partagée par langue
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ Construction     │ ← build_context()
                           │ Contexte          │ ← context_builder.py
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ LLM              │ ← call_llm()
                           │ ai_extractor.py  │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ Sauvegarde BDD   │ ← AnalyseDce
                           └──────────────────┘
```

## 2. Idempotence par Étape

### Étape 1 : Téléchargement ZIP

**Entrées** : AppelOffres.id, AppelOffres.url_cps
**Sorties** : AppelOffres.url_cps (mise à jour)
**Persisté disque** : ZIP téléchargé
**Persisté BDD** : AppelOffres.url_cps
**Conditions de reprise** : Seulement si `url_cps` est vide

**IDEMPOTENCE** : ✅ PARTIELLE
- Si `url_cps` existe, le téléchargement est SKIP
- Si `url_cps` est vide, le téléchargement est refait

---

### Étape 2 : Dézippage ZIP

**Entrées** : appel_offres_id, zip_path
**Sorties** : list[ExtractedFile]
**Persisté disque** : Dossier `dce_extracted_storage_path/{appel_offres_id}/`
**Persisté BDD** : Aucun
**Conditions de reprise** : ❌ AUCUNE (modifié récemment pour SKIP si dossier existe)

**IDEMPOTENCE** : ✅ CORRIGÉE
- Si le dossier existe déjà, SKIP et retourne les fichiers déjà extraits
- Si le dossier n'existe pas, RUN et extrait

---

### Étape 3 : Indexation Documents

**Entrées** : appel_offres_id, extracted_files, output_dir
**Sorties** : list[DceDocument]
**Persisté disque** : Aucun
**Persisté BDD** : DceDocument (supprimés puis réinsérés)
**Conditions de reprise** : ❌ AUCUNE

**IDEMPOTENCE** : ❌ NON-IDEMPOTENTE
- Ligne 30 : `db.query(DceDocument).filter(DceDocument.appel_offres_id == appel_offres_id).delete()`
- **TOUJOURS supprime tous les documents existants**
- **TOUJOURS réindexe tous les fichiers**

**PROBLÈME** : Reconstruction systématique même si rien n'a changé

---

### Étape 4 : Extraction Texte

**Entrées** : ExtractedFile, output_dir
**Sorties** : ExtractionResult (texte_extrait_path, nb_caracteres, statut)
**Persisté disque** : Fichiers .txt
**Persisté BDD** : DceDocument.texte_extrait_path
**Conditions de reprise** : ❌ AUCUNE

**IDEMPOTENCE** : ❌ NON-IDEMPOTENTE
- Pas de vérification si le .txt existe déjà
- **TOUJOURS réextrait le texte**

**PROBLÈME** : Reconstruction systématique même si .txt existe déjà

---

### Étape 5 : OCR (PDF scanné)

**Entrées** : pdf_path, output_dir
**Sorties** : str (texte OCR)
**Persisté disque** : Fichier .txt + Cache OCR (JSON)
**Persisté BDD** : Aucun
**Conditions de reprise** : ✅ Cache HIT

**IDEMPOTENCE** : ✅ IDEMPOTENTE
- Vérifie le cache OCR
- Si cache HIT, SKIP et utilise le cache
- Si cache MISS, RUN et sauvegarde

---

### Étape 6 : Construction Contexte

**Entrées** : appel_offres_id, max_chars
**Sorties** : BuiltContext (texte, documents_inclus, tronque)
**Persisté disque** : Aucun
**Persisté BDD** : Aucun
**Conditions de reprise** : ❌ AUCUNE

**IDEMPOTENCE** : ❌ NON-IDEMPOTENTE
- Pas de cache du contexte
- **TOUJOURS reconstruit le contexte**

**PROBLÈME** : Reconstruction systématique

---

### Étape 7 : LLM

**Entrées** : AppelOffres, contexte texte
**Sorties** : dict (résultat LLM)
**Persisté disque** : Aucun
**Persisté BDD** : AnalyseDce (tous les champs)
**Conditions de reprise** : ✅ Si statut=="complete" et !force

**IDEMPOTENCE** : ✅ IDEMPOTENTE
- Si statut=="complete", SKIP (court-circuit en début de pipeline)
- Sinon, RUN

---

### Étape 8 : Sauvegarde BDD

**Entrées** : AnalyseDce, résultat LLM
**Sorties** : AnalyseDce mis à jour
**Persisté disque** : Aucun
**Persisté BDD** : AnalyseDce
**Conditions de reprise** : ❌ AUCUNE (upsert)

**IDEMPOTENCE** : ✅ IDEMPOTENTE
- Upsert (update or insert)
- Pas de duplication

---

## 3. Conditions de Reconstruction Complète

Un AO repart depuis le début si :

1. **Statut != "complete"**
   - Si statut est "partielle", "echec", ou "en_cours"
   - Le court-circuit ne fonctionne pas

2. **force=True**
   - Force explicitement la reconstruction

3. **Relance après échec partiel**
   - Si l'OCR échoue mais que le pipeline continue
   - Le statut peut être "partielle"
   - La relance repart du début

**PROBLÈME** : Pas de reprise à partir de l'étape échouée

---

## 4. Temps par Étape (basé sur les logs observés)

```
================ AO XXX ================

ZIP ............... 0.2 s (téléchargement)
UNZIP ............. 0.5 s (dézippage)
INDEX ............. 0.8 s (indexation BDD)
TXT ............... SKIP (si .txt existe) ou REBUILD (si .txt régénéré)
OCR ............... 95-106 s par page PDF scanné
CONTEXT ........... 0.4 s
LLM ............... 15-20 s
SAVE .............. 0.2 s

TOTAL ............. Variable selon nombre de pages scannées
```

**GOULET IDENTIFIÉ** : OCR (95-106 s par page)

---

## 5. Utilisation CPU

### Instances PaddleOCR
- **1 instance par langue** (cache dans `_paddle_ocr_instances`)
- Partagée entre tous les documents de la même langue
- Chargée une seule fois par langue au premier appel

### Threads
- **OMP_NUM_THREADS = 4** (défini dans text_extractor.py ligne 20)
- **MKL_NUM_THREADS = 4** (défini dans text_extractor.py ligne 21)
- Limité pour éviter la contention CPU

### Workers FastAPI
- **1 worker** (configuration par défaut de uvicorn)
- Traitement séquentiel des requêtes HTTP

### Parallélisme
- **0 PDF traités en parallèle** (séquentiel)
- **0 pages traitées en parallèle** (séquentiel)

**PROBLÈME** : Aucun parallélisme réel

---

## 6. Logs Actuels - Problèmes

### Problème 1 : Verbosité excessive
- 300+ lignes de logs par AO
- Difficile de suivre l'exécution
- Informations de debug mélangées avec les logs de synthèse

### Problème 2 : Répétition
- Version PaddleOCR affichée à chaque appel predict()
- Dimensions d'image affichées à chaque page
- Nombre de blocs affiché à chaque page

### Problème 3 : Pas de vue globale
- Pas de résumé par AO
- Pas de temps total par étape
- Difficile d'identifier le goulot rapidement

---

## 7. Timeout Frontend

**Message affiché** : "L'analyse prend trop de temps. Veuillez réessayer plus tard."

**Origine probable** :
- Timeout frontend (polling)
- Défaut : 60-120 secondes
- Si le pipeline prend > 2 minutes, le frontend affiche ce message

**PROBLÈME** : Le frontend n'attend pas indéfiniment

---

## 8. Points Non Idempotents Identifiés

### ✅ Bug confirmé par le code

1. **Indexation Documents**
   - Ligne 30 : Suppression systématique des DceDocument
   - Impact : Réindexation complète à chaque relance

2. **Extraction Texte**
   - Pas de vérification si .txt existe
   - Impact : Réextraction complète à chaque relance

3. **Construction Contexte**
   - Pas de cache du contexte
   - Impact : Reconstruction systématique

### ⚠️ Hypothèse (besoin de logs)

1. **Dézippage**
   - Maintenant corrigé (SKIP si dossier existe)
   - Besoin de logs pour confirmer

---

## 9. Reconstructions Inutiles

### Scénario typique

1. **AO déjà traité** (statut="complete")
2. **Utilisateur relance l'analyse**
3. **Pipeline court-circuite** (statut=="complete")
4. **Aucune reconstruction** ✅

### Scénario problème

1. **AO partiellement traité** (statut="partielle")
2. **Utilisateur relance l'analyse**
3. **Pipeline ne court-circuite PAS** (statut!="complete")
4. **Reconstruction complète** ❌
   - Suppression des DceDocument
   - Réextraction de tous les .txt
   - Reconstruction du contexte
   - Rappel au LLM

**PROBLÈME** : Pas de reprise intelligente

---

## 10. Goulots Identifiés

### Goulot 1 : OCR (PRINCIPAL)
- **Temps** : 95-106 s par page PDF scanné
- **Cause** : PaddleOCR predict() lent
- **Impact** : 98% du temps total
- **Priorité** : CRITIQUE

### Goulot 2 : Indexation
- **Temps** : Variable selon nombre de fichiers
- **Cause** : Reconstruction systématique
- **Impact** : Si fichiers déjà extraits, temps perdu
- **Priorité** : ÉLEVÉE

### Goulot 3 : Timeout Frontend
- **Temps** : 60-120 s
- **Cause** : Timeout polling frontend
- **Impact** : Message d'erreur utilisateur
- **Priorité** : MOYENNE

---

## 11. Corrections Classées par Gain

### Correction 1 : Rendre l'indexation idempotente
**Gain attendu** : Élimination des reconstructions inutiles
**Impact** : Si fichiers déjà extraits, gain = temps d'extraction
**Priorité** : ÉLEVÉE
**Modification** : Upsert au lieu de delete+insert

### Correction 2 : Rendre l'extraction texte idempotente
**Gain attendu** : Élimination des réextractions inutiles
**Impact** : Si .txt existe déjà, gain = temps d'extraction
**Priorité** : ÉLEVÉE
**Modification** : Vérifier si .txt existe avant extraction

### Correction 3 : Cache du contexte
**Gain attendu** : Élimination de la reconstruction du contexte
**Impact** : Si contexte inchangé, gain = temps de construction
**Priorité** : MOYENNE
**Modification** : Cache du contexte basé sur hash des documents

### Correction 4 : Reprise intelligente
**Gain attendu** : Reprise à partir de l'étape échouée
**Impact** : Si seule l'OCR échoue, gain = temps des étapes précédentes
**Priorité** : MOYENNE
**Modification** : Stocker l'état du pipeline par étape

### Correction 5 : Optimisation OCR
**Gain attendu** : Réduction du temps OCR de 95-106 s à 3-5 s par page
**Impact** : 20-30x plus rapide
**Priorité** : CRITIQUE
**Modification** : Changer de modèle (PP-OCRv5_mobile) ou backend

### Correction 6 : Parallélisation OCR
**Gain attendu** : Réduction du temps OCR par nombre de workers
**Impact** : 2-4x plus rapide avec 2-4 workers
**Priorité** : MOYENNE
**Modification** : ThreadPoolExecutor pour les pages

### Correction 7 : Augmentation timeout frontend
**Gain attendu** : Élimination du message d'erreur
**Impact** : Meilleure UX
**Priorité** : FAIBLE
**Modification** : Augmenter le timeout polling

---

## 12. Recommandations

### Immédiat (Phase 1 - Idempotence)
1. Corriger l'indexation pour être idempotente
2. Corriger l'extraction texte pour être idempotente
3. Simplifier les logs (synthèse par AO)

### Court terme (Phase 2 - Performance)
4. Optimiser PaddleOCR (changer de modèle ou backend)
5. Paralléliser l'OCR
6. Cache du contexte

### Moyen terme (Phase 3 - Robustesse)
7. Reprise intelligente du pipeline
8. Augmenter le timeout frontend

---

## 13. Conclusion

**Problème principal** : Le pipeline n'est pas idempotent et reconstruit systématiquement les étapes d'indexation et d'extraction, même si les fichiers existent déjà.

**Goulot principal** : OCR (95-106 s par page)

**Correction prioritaire** : Rendre le pipeline idempotent avant d'optimiser l'OCR, pour éviter de mesurer des performances qui incluent des retraitements inutiles.
