# Implémentation CPS Only - Optimisation

## Date
2026-08-10

## Modifications Effectuées

### 1. Ajout de la fonction helper `_is_cps_file()` (text_extractor.py lignes 48-62)

**Ajouté :**
```python
def _is_cps_file(nom_fichier: str) -> bool:
    """
    Vérifie si le fichier est le CPS (insensible à la casse).
    
    Le CPS est toujours identifiable par son nom de fichier qui contient "cps".
    Exemples : CPS.pdf, CPS BET ROUTE.pdf, AOO_CPS_2026.pdf, etc.
    
    Cette fonction est utilisée pour l'optimisation CPS Only : seul le CPS scanné
    est traité par OCR, les autres documents scannés sont ignorés.
    """
    return "cps" in nom_fichier.lower()
```

**Justification :** Détecter le CPS de manière insensible à la casse pour appliquer l'optimisation.

---

### 2. Modification de la logique de bascule OCR (text_extractor.py lignes 912-921)

**Changement :**
```python
# Avant
if nb_chars == 0 and erreur != "pdf_natif_vide":
    logger.info(f"[OCR] Aucun texte natif — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
    nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)

# Après
if nb_chars == 0 and erreur != "pdf_natif_vide":
    # OPTIMISATION CPS ONLY : Ne lancer l'OCR que sur le CPS scanné
    # Les autres documents scannés sont ignorés pour gagner du temps
    if _is_cps_file(extracted_file.nom_fichier):
        logger.info(f"[OCR] CPS scanné détecté — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
        nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
    else:
        logger.info(f"[OCR] Document scanné non-CPS ignoré pour optimisation : {extracted_file.nom_fichier}")
        # Retourner un statut spécifique pour document scanné ignoré
        return ExtractionResult(None, 0, "ocr_ignore", "Document scanné non-CPS ignoré pour optimisation du temps de traitement")
```

**Justification :** Ne lancer l'OCR que sur le CPS scanné, ignorer les autres documents scannés.

---

### 3. Ajout du nouveau statut dans DceDocument (dce_document.py ligne 41-46)

**Changement :**
```python
# Avant
# Valeurs possibles : succes | echec | non_supporte
statut_extraction = Column(String, nullable=False, default="en_attente")

# Après
# Valeurs possibles : succes | echec | non_supporte | ocr_ignore
statut_extraction = Column(String, nullable=False, default="en_attente")
```

**Justification :** Ajouter le statut "ocr_ignore" pour les documents scannés non-CPS ignorés.

---

### 4. Document indexer (document_indexer.py)

**Modification :** AUCUNE

**Justification :** Le document_indexer utilise déjà `result.statut`, donc le nouveau statut "ocr_ignore" sera automatiquement pris en compte.

---

## Comportement Résultant

### Avant l'optimisation
- Tous les documents scannés sont OCRisés
- Temps OCR proportionnel au nombre de documents scannés

### Après l'optimisation
- **PDF natif / DOCX / extractible normalement** → Comportement inchangé
- **Document scanné ET identifié comme CPS** → OCR lancé normalement
- **Document scanné MAIS PAS le CPS** → OCR ignoré, statut "ocr_ignore"

---

## Logs Attendus

### CPS scanné (OCR activé)
```
[OCR] CPS scanné détecté — tentative OCR (PaddleOCR) pour CPS.pdf
[OCR] Fichier: CPS.pdf, Pages: 25
[OCR] Succès : 45669 caractères extraits de 25 pages
```

### Document scanné non-CPS (OCR ignoré)
```
[OCR] Document scanné non-CPS ignoré pour optimisation : RC.pdf
```

### PDF natif (comportement inchangé)
```
[DIAG] PDF détecté comme natif : 15/15 pages avec texte significatif
[DIAG] Succès extraction PDF natif (pdfplumber) : 12345 caractères.
```

---

## Impact sur les Composants

### Indexation (document_indexer.py)
- **Impact :** MINIMAL
- **Raison :** Les documents avec statut "ocr_ignore" sont quand même indexés
- **Résultat :** Le document reste visible dans la base de données

### Contexte LLM (dce_pipeline.py)
- **Impact :** MINIMAL
- **Raison :** Le contexte ne contiendra que les documents traités (CPS + PDF natifs)
- **Résultat :** Le CPS contient les informations essentielles

### Affichage (frontend)
- **Impact :** POSITIF
- **Raison :** Les documents restent visibles avec le statut "ocr_ignore"
- **Action requise :** Ajouter un avertissement dans l'UI

---

## Modification Frontend Requise

### Avertissement à afficher

**Emplacement :** Dans la liste des documents du DCE ou dans un panel d'alertes

**Code JavaScript (exemple) :**
```javascript
// Vérifier si un document a le statut "ocr_ignore"
const hasIgnoredDocuments = documents.some(doc => doc.statut_extraction === "ocr_ignore");

if (hasIgnoredDocuments) {
    // Afficher l'avertissement
    showWarning("D'autres documents scannés n'ont pas été traités automatiquement. Veuillez les consulter pour plus de précision.");
}
```

---

## Gain Estimé

### Scénario typique
- CPS scanné : 25 pages
- RC scanné : 15 pages
- Autres documents scannés : 10 pages

### Avant
- Temps OCR CPS : 575 s (25 pages × 23 s/page)
- Temps OCR RC : 345 s (15 pages × 23 s/page)
- Temps OCR autres : 230 s (10 pages × 23 s/page)
- **Total OCR : 1150 s**

### Après
- Temps OCR CPS : 575 s (25 pages × 23 s/page)
- Temps OCR RC : 0 s (ignoré)
- Temps OCR autres : 0 s (ignorés)
- **Total OCR : 575 s**

### Gain
- **Gain absolu :** 575 s économisées
- **Gain relatif :** 50%
- **Gain potentiel :** Jusqu'à 80% selon le nombre de documents scannés non-CPS

---

## Tests de Validation

### Test 1 : Détection CPS
```python
assert _is_cps_file("CPS.pdf") == True
assert _is_cps_file("CPS BET ROUTE.pdf") == True
assert _is_cps_file("AOO_CPS_2026.pdf") == True
assert _is_cps_file("cps.pdf") == True
assert _is_cps_file("RC.pdf") == False
assert _is_cps_file("DCE.pdf") == False
assert _is_cps_file("Annexe.pdf") == False
```

### Test 2 : Logique de bascule
- PDF natif → Extraction native, pas d'OCR
- CPS scanné → OCR activé
- RC scanné → OCR ignoré, statut "ocr_ignore"

### Test 3 : Indexation
- Document avec statut "ocr_ignore" → Indexé correctement
- Document avec statut "ocr_ignore" → Visible dans l'UI

---

## Conclusion

L'optimisation CPS Only a été implémentée avec succès :

- ✅ Fonction helper `_is_cps_file()` ajoutée
- ✅ Logique de bascule OCR modifiée
- ✅ Nouveau statut "ocr_ignore" ajouté
- ✅ Document indexer compatible (pas de modification requise)
- ⏭️ Frontend : Ajouter l'avertissement pour les documents ignorés

**Gain estimé :** 50-80% de temps OCR économisé selon le nombre de documents scannés non-CPS.

**Prêt pour le test de validation.**
