# Diagnostic des Versions PaddlePaddle / PaddleOCR

## Commandes Exécutées

```bash
python -m pip show paddlepaddle
```
**Résultat** : WARNING: Package(s) not found: paddlepaddle

```bash
python -m pip list
```
**Résultat** : Aucun package "paddle" dans la liste complète (200+ packages)

```bash
python -m pip list | findstr -i paddle
```
**Résultat** : Aucun résultat

## Conclusion

**PaddlePaddle n'est PAS installé** dans l'environnement Python actuel.

Cela explique pourquoi :
- L'OCR fonctionne sur les PDF natifs (pas besoin de PaddlePaddle)
- L'OCR échoue sur les PDF scannés (PaddleOCR nécessite PaddlePaddle)

## Problème

Le fichier `requirements.txt` contient :
```
paddlepaddle
paddleocr
```

Mais ces packages ne sont pas installés dans l'environnement actuel.

## Action Requise

Installer les dépendances OCR :

```bash
cd C:\Users\nasri\OneDrive\Desktop\Projects\SIS_Marches\backend
python -m pip install -r requirements.txt
```

Ou uniquement les packages OCR :

```bash
python -m pip install paddlepaddle paddleocr opencv-python-headless pymupdf
```

## Compatibilité des Versions

Selon la documentation PaddleOCR 3.7.0 :
- **PaddlePaddle 2.6.1** : ✅ Compatible (version stable recommandée)
- **PaddlePaddle 3.3.x** : ⚠️ Bug MKLDNN connu (Issue #77340)
- **PaddlePaddle 3.4.0+** : ✅ Fix inclus (commit 12bff20)

## Recommandation

Installer PaddlePaddle 2.6.1 pour avoir une version stable avec MKLDNN fonctionnel :

```bash
python -m pip install paddlepaddle==2.6.1
python -m pip install paddleocr
```

Ensuite, activer `enable_mkldnn=True` pour bénéficier de l'accélération CPU.
