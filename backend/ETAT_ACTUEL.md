# État Actuel du Pipeline - Base Stable pour Expérimentations OCR

## Date
2026-08-07

## Modifications Effectuées

### 1. Corrections de Bugs
- ✅ Bug `os` corrigé dans `_ocr_pdf_scanne_parallel()` (text_extractor.py)
- ✅ Fichiers .txt ignorés dans `_is_junk()` (zip_extractor.py)
- ✅ Logique métier corrigée pour utiliser uniquement les champs indispensables (dce_pipeline.py)
- ✅ Détection de plans techniques désactivée (text_extractor.py)

### 2. Logs Améliorés
- ✅ Logs OCR avec progression : `[OCR] Page X/Y`
- ✅ Logs de synthèse par AO formatés
- ✅ Logs métier cohérents avec la nouvelle règle

### 3. OCR Parallèle
- ⏸️ Désactivé temporairement (revenu à séquentiel)
- ⏸️ Fonction `_ocr_pdf_scanne_parallel()` disponible mais non utilisée

### 4. Fichiers Ajoutés
- `DIAGNOSTIC_REGRESSION.md` - Diagnostic de la régression ×4
- `DIAGNOSTIC_PADDLEOCR.md` - Diagnostic PaddleOCR
- `DIAGNOSTIC_PADDLEOCR_SLOW.md` - Diagnostic pourquoi 60s par page
- `AUDIT_PIPELINE.md` - Audit d'architecture du pipeline
- `scripts/debug/benchmark_ocr.py` - Benchmark comparatif de modèles
- `scripts/debug/profile_paddleocr.py` - Script de profilage
- `scripts/debug/profile_paddleocr_simple.py` - Script de profilage simplifié

## État du Pipeline

### Extraction PDF Native
- ✅ Fonctionne correctement
- ✅ CPS (23 pages) : 3.39 s
- ✅ RC (15 pages) : 2.31 s
- ✅ Indexation totale : 7.5 s

### OCR (PDF Scannés)
- ⏸️ En attente de validation
- ⏸️ Non testé sur le dernier AO (PDF natifs)

### LLM
- ⚠️ Goulot d'étranglement principal (~42 s)
- ⏸️ À optimiser après validation OCR

## Prochaine Étape

1. Tester enable_mkldnn sur un AO scanné (CPS + RC)
2. Comparer :
   - Temps OCR avant / après enable_mkldnn
   - Temps par page
   - Nombre de caractères extraits
   - Qualité de l'extraction
3. Si enable_mkldnn fonctionne : optimiser LLM
4. Si enable_mkldnn ne fonctionne pas : changer de modèle OCR

## Configuration Actuelle OCR

```python
# text_extractor.py lignes 60-66
_paddle_ocr_instances[lang] = PaddleOCR(
    lang=lang,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False,  # ← À tester = True
)
```

## Variables d'Environnement

```python
# text_extractor.py lignes 20-21
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```

## DPI

```python
# text_extractor.py ligne 322
pix = page.get_pixmap(dpi=200)  # ← Standard pour OCR
```
