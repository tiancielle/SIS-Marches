# Benchmark OMP - Configuration

## Date
2026-08-10

## Modification Effectuée

### Fichier : `text_extractor.py`

#### Modification : Restauration de OMP_NUM_THREADS=4 (lignes 16-22)

**Changement :**
```python
# Avant
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")

# Après
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
```

**Justification :** Benchmark pour mesurer l'impact réel de OMP_NUM_THREADS sur les performances OCR séquentielles.

---

## Configuration Actuelle

| Paramètre | Valeur | Statut |
|-----------|--------|--------|
| OMP_NUM_THREADS | 4 | ✅ Restauré |
| MKL_NUM_THREADS | 4 | ✅ Restauré |
| enable_mkldnn | False | ✅ Maintenu |
| Modèle OCR | PP-OCRv6_small_det/rec | ✅ Maintenu |
| DPI | 200 | ✅ Maintenu |
| Mode | Séquentiel | ✅ Maintenu |

---

## Baseline OMP=2 (Mesures Fournies)

### Données du test précédent
- **Fichier :** CPS.pdf
- **Pages :** 14
- **INDEX total :** 333.0 s
- **Temps moyen predict() (pages 1-12) :** 22.33 s/page
- **Variation predict() :** 13-32 s/page
- **Conversion :** ~0.3-0.4 s/page
- **Preprocessing :** ~0.3 s/page

### Analyse
- **predict() :** 97.2% du temps OCR (bottleneck)
- **Conversion + preprocessing :** 2.8% du temps OCR (négligeable)
- **Variation predict() :** Normale (explicable par la complexité variable du contenu)

---

## Protocole de Benchmark

### Test à effectuer
1. Relancer exactement le même CPS de 14 pages
2. Récupérer les logs complets incluant :
   - `[OCR] Page X/14` pour toutes les 14 pages
   - `predict()` pour chaque page
   - Temps total `INDEX`
   - Temps total du pipeline

### Comparaison attendue
- **Baseline OMP=2 :** INDEX = 333.0 s (mesuré)
- **Benchmark OMP=4 :** À mesurer
- **Gain attendu :** À mesurer (pas d'estimation)

---

## Méthodologie

### Contrôles
- ✅ Seul OMP_NUM_THREADS modifié (4 au lieu de 2)
- ✅ MKL_NUM_THREADS modifié en conséquence (4 au lieu de 2)
- ✅ enable_mkldnn maintenu à False
- ✅ Modèle OCR maintenu (PP-OCRv6_small)
- ✅ DPI maintenu à 200
- ✅ Mode séquentiel maintenu
- ✅ Même CPS de 14 pages

### Objectif
- Mesurer l'impact réel de OMP_NUM_THREADS sur les performances OCR
- Isoler le facteur OMP sans changer d'autres paramètres
- Éviter les estimations théoriques et se baser sur des mesures réelles

---

## Prochaines Étapes

### Si OMP=4 apporte un gain significatif (>20%)
- Confirmer que OMP est un facteur de performance
- Passer au benchmark enable_mkldnn=True

### Si OMP=4 apporte un gain faible (<10%)
- OMP n'est pas le facteur principal
- enable_mkldnn=False est probablement le goulet majeur
- Passer directement au benchmark PP-OCRv5_mobile

---

## Conclusion

Le benchmark OMP=4 est prêt. L'objectif est d'obtenir une mesure factuelle de l'impact de OMP_NUM_THREADS sur les performances OCR séquentielles, sans estimations théoriques.

**Prêt pour le test sur le même CPS de 14 pages.**
