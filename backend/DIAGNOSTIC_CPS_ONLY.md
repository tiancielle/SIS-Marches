# Diagnostic - Optimisation CPS Only

## Date
2026-08-10

## Objectif

Ne lancer l'OCR que sur le CPS scanné, et ignorer les autres documents scannés pour gagner du temps.

---

## Réponses aux 7 Questions

### 1. Où est détecté qu'un PDF est natif ou scanné ?

**Réponse :** Dans `_extract_pdf()` (text_extractor.py lignes 652-724)

**Détails :**
```python
# text_extractor.py lignes 688-696
if total_pages > 0 and pages_with_text / total_pages < 0.5:
    is_scanned = True
    logger.info(f"[DIAG] PDF détecté comme scanné : {pages_with_text}/{total_pages} pages avec texte significatif")
    # PDF scanné : retourner 0 pour déclencher l'OCR
    if os.path.exists(out_path):
        os.remove(out_path)
    return 0, None
```

**Critère :** Si moins de 50% des pages ont du texte significatif (>50 caractères), le PDF est considéré comme scanné.

---

### 2. Où est déclenché `_ocr_pdf_scanne()` ?

**Réponse :** Dans `extract_text()` (text_extractor.py ligne 903)

**Détails :**
```python
# text_extractor.py lignes 899-903
if nb_chars == 0 and erreur != "pdf_natif_vide":
    logger.info(f"[OCR] Aucun texte natif — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
    nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
```

**Condition :** Si l'extraction native retourne 0 caractères et que l'erreur n'est pas "pdf_natif_vide", l'OCR est déclenché.

---

### 3. Où peut-on faire cette distinction CPS scanné / autre document scanné ?

**Réponse :** Dans `extract_text()` avant d'appeler `_ocr_pdf_scanne()` (ligne 903)

**Détails :**
- On a accès à `extracted_file.nom_fichier` (nom original du fichier)
- On peut vérifier si "cps" est dans le nom (insensible à la casse)
- Idéalement ajouter une fonction helper `_is_cps_file(nom_fichier: str) -> bool`

**Emplacement proposé :**
```python
# text_extractor.py ligne 901-903
if nb_chars == 0 and erreur != "pdf_natif_vide":
    # Vérifier si c'est le CPS
    if _is_cps_file(extracted_file.nom_fichier):
        logger.info(f"[OCR] CPS scanné détecté — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
        nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
    else:
        logger.info(f"[OCR] Document scanné non-CPS ignoré : {extracted_file.nom_fichier}")
        # Retourner un statut spécifique pour document scanné ignoré
        return ExtractionResult(None, 0, "ocr_ignore", "Document scanné non-CPS ignoré")
```

---

### 4. Est-ce que cette modification risque de casser l'indexation, le contexte envoyé au LLM ou l'affichage des documents ?

**Réponse :** NON, si implémentée correctement

**Analyse par composant :**

#### Indexation (document_indexer.py)
- **Impact :** MINIMAL
- **Raison :** Le document sera quand même indexé dans DceDocument
- **Condition :** Il faut un nouveau statut "ocr_ignore" dans DceDocument

#### Contexte LLM (dce_pipeline.py)
- **Impact :** MINIMAL
- **Raison :** Le document sans OCR n'aura pas de texte extrait
- **Condition :** Le contexte LLM ne contiendra que les documents traités (CPS + PDF natifs)
- **Acceptable :** Le CPS contient les informations essentielles

#### Affichage des documents (frontend)
- **Impact :** POSITIF
- **Raison :** Les documents restent visibles mais avec un statut spécifique
- **Condition :** Le frontend peut afficher un avertissement pour les documents ignorés

---

### 5. Comment conserver l'information qu'un document scanné a volontairement été ignoré par l'OCR ?

**Réponse :** Ajouter un nouveau statut dans DceDocument

**Proposition :**
```python
# dce_document.py ligne 46
# Valeurs possibles : succes | echec | non_supporte | ocr_ignore
statut_extraction = Column(String, nullable=False, default="en_attente")
```

**Ou utiliser le champ erreur :**
```python
# Dans extract_text()
return ExtractionResult(
    None, 0, "non_supporte",
    "Document scanné non-CPS ignoré pour optimisation du temps de traitement"
)
```

**Recommandation :** Nouveau statut "ocr_ignore" pour plus de clarté.

---

### 6. Comment transmettre cette information au frontend pour afficher l'avertissement ?

**Réponse :** Via l'API REST qui retourne les DceDocument

**Proposition :**
1. Le modèle DceDocument inclut déjà `statut_extraction`
2. L'API retourne la liste des documents avec leur statut
3. Le frontend vérifie si un document a `statut_extraction == "ocr_ignore"`
4. Si oui, afficher l'avertissement : "D'autres documents scannés n'ont pas été traités automatiquement. Veuillez les consulter pour plus de précision."

**Emplacement frontend :**
- Dans la liste des documents du DCE
- Dans la timeline des événements
- Dans un panel d'alertes

---

### 7. Vérification de la détection CPS insensible à la casse

**Réponse :** Fonctionne correctement avec Python

**Test :**
```python
def _is_cps_file(nom_fichier: str) -> bool:
    """Vérifie si le fichier est le CPS (insensible à la casse)."""
    return "cps" in nom_fichier.lower()

# Tests
assert _is_cps_file("CPS.pdf") == True
assert _is_cps_file("CPS BET ROUTE.pdf") == True
assert _is_cps_file("AOO_CPS_2026.pdf") == True
assert _is_cps_file("cps.pdf") == True
assert _is_cps_file("RC.pdf") == False
assert _is_cps_file("DCE.pdf") == False
assert _is_cps_file("Annexe.pdf") == False
```

**Résultat :** ✅ Fonctionne pour tous les cas mentionnés.

---

## Proposition d'Implémentation

### Étape 1 : Ajouter la fonction helper

**Dans text_extractor.py :**
```python
def _is_cps_file(nom_fichier: str) -> bool:
    """
    Vérifie si le fichier est le CPS (insensible à la casse).
    
    Le CPS est toujours identifiable par son nom de fichier qui contient "cps".
    Exemples : CPS.pdf, CPS BET ROUTE.pdf, AOO_CPS_2026.pdf, etc.
    """
    return "cps" in nom_fichier.lower()
```

---

### Étape 2 : Modifier la logique de bascule OCR

**Dans text_extractor.py (ligne 901-903) :**
```python
# LOGIQUE DE BASCULE OCR : Si l'extraction native ne renvoie aucun caractère
# ET que l'erreur n'est pas "pdf_natif_vide", on en déduit que le PDF est scanné
if nb_chars == 0 and erreur != "pdf_natif_vide":
    # OPTIMISATION : Ne lancer l'OCR que sur le CPS scanné
    if _is_cps_file(extracted_file.nom_fichier):
        logger.info(f"[OCR] CPS scanné détecté — tentative OCR (PaddleOCR) pour {extracted_file.nom_fichier}.")
        nb_chars_ocr, erreur_ocr = _ocr_pdf_scanne(extracted_file.absolute_path, out_path)
    else:
        logger.info(f"[OCR] Document scanné non-CPS ignoré : {extracted_file.nom_fichier}")
        # Retourner un statut spécifique pour document scanné ignoré
        return ExtractionResult(None, 0, "ocr_ignore", "Document scanné non-CPS ignoré")
```

---

### Étape 3 : Ajouter le nouveau statut dans DceDocument

**Dans dce_document.py (ligne 46) :**
```python
# MACHINE À ÉTATS (State Machine) : Ce champ permet au pipeline de signaler
# précisément pourquoi un document n'a pas pu être traité (ex: format non supporté,
# fichier corrompu, échec OCR, ou document scanné non-CPS ignoré).
# Valeurs possibles : succes | echec | non_supporte | ocr_ignore
statut_extraction = Column(String, nullable=False, default="en_attente")
```

---

### Étape 4 : Modifier document_indexer.py pour gérer le nouveau statut

**Dans document_indexer.py :**
```python
# Ajouter "ocr_ignore" aux statuts valides
# Le document sera quand même indexé mais avec le statut "ocr_ignore"
```

---

### Étape 5 : Modifier le frontend pour afficher l'avertissement

**Dans le frontend :**
```javascript
// Vérifier si un document a le statut "ocr_ignore"
const hasIgnoredDocuments = documents.some(doc => doc.statut_extraction === "ocr_ignore");

if (hasIgnoredDocuments) {
    // Afficher l'avertissement
    showWarning("D'autres documents scannés n'ont pas été traités automatiquement. Veuillez les consulter pour plus de précision.");
}
```

---

## Avantages de cette Optimisation

### Gain de temps
- **Actuel :** Tous les documents scannés sont OCRisés
- **Optimisé :** Seul le CPS scanné est OCRisé
- **Gain estimé :** 50-80% selon le nombre de documents scannés non-CPS

### Fiabilité
- Le CPS contient les informations essentielles
- Les autres documents restent visibles
- L'utilisateur est informé des documents ignorés

### Simplicité
- Modification minimale du code
- Pas d'architecture complexe
- Réversible facilement

---

## Risques et Atténuation

### Risque 1 : Le CPS n'est pas détecté correctement
- **Atténuation :** Log de détection du CPS pour vérifier
- **Fallback :** Le document sera traité comme natif vide (pas d'OCR)

### Risque 2 : Un document important non-CPS est ignoré
- **Atténuation :** Avertissement dans l'UI
- **Fallback :** L'utilisateur peut consulter manuellement le document

### Risque 3 : Le contexte LLM est incomplet
- **Atténuation :** Le CPS contient les informations essentielles
- **Fallback :** Les documents natifs sont quand même inclus

---

## Conclusion

**Faisabilité :** ✅ HAUTE

**Emplacement d'implémentation :**
- Fonction helper `_is_cps_file()` dans text_extractor.py
- Modification de la logique de bascule OCR dans extract_text()
- Nouveau statut "ocr_ignore" dans DceDocument
- Avertissement dans le frontend

**Impact :**
- Indexation : ✅ Non impacté (documents quand même indexés)
- Contexte LLM : ✅ Impact minimal (CPS + PDF natifs suffisent)
- Affichage : ✅ Positif (avertissement informatif)

**Gain estimé :** 50-80% de temps OCR économisé selon le nombre de documents scannés non-CPS.

**Recommandation :** Implémenter cette optimisation AVANT l'optimisation du modèle OCR, car elle apporte un gain significatif sans complexité.
