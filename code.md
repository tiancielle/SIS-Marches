(sis_env) PS C:\Users\nasri\OneDrive\Desktop\Projects\SIS_Marches\backend> python -m uvicorn app.main:app --reload --port 8000
INFO:     Will watch for changes in these directories: ['C:\\Users\\nasri\\OneDrive\\Desktop\\Projects\\SIS_Marches\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [30520] using WatchFiles
INFO:     Started server process [5840]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     127.0.0.1:52566 - "GET /dce/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:49701 - "GET /contrats/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:50885 - "GET /sous-traitants/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /dce/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projet-equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:49701 - "GET /equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:50885 - "GET /contrats/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /sous-traitants/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projet-equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:63023 - "GET /projets/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57749 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projets/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:63023 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91/telecharger-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "POST /appels-offres/91/telecharger-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "POST /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
2026-08-04 16:20:29,950 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Début pipeline AO 149
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:29,974 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Téléchargement DCE : déjà disponible (0.00s)
2026-08-04 16:20:30,083 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Dézippage : 0.11s, 6 fichiers extraits
2026-08-04 16:20:30,087 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Acte d'engagement - AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:30,882 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 4704 caractères.
2026-08-04 16:20:30,883 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Avis d'appel d'offre - Ar - AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:31,198 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 1465 caractères.
2026-08-04 16:20:31,198 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Avis d'appel d'offre - Fr -AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:31,484 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 1795 caractères.
2026-08-04 16:20:31,485 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : CPS - AO 33-2026.pdf (type: pdf)
INFO:     127.0.0.1:65377 - "POST /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
2026-08-04 16:20:31,489 WARNING app.services.dce_processing.dce_pipeline: [DIAG] Traitement DCE déjà en cours pour AppelOffres 149 — appel ignoré.
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:31,549 WARNING app.services.dce_processing.text_extractor: [DIAG] PDF vide : probablement un PDF scanné (image).
2026-08-04 16:20:31,549 INFO app.services.dce_processing.text_extractor: [DIAG] Aucun texte natif — tentative OCR (PaddleOCR) pour CPS - AO 33-2026.pdf.
2026-08-04 16:20:31,557 INFO app.services.dce_processing.ocr_cache: [CACHE] MISS pour CPS - AO 33-2026.pdf (hash: da9e7d92...)
2026-08-04 16:20:31,557 INFO app.services.dce_processing.text_extractor: [CACHE] MISS : 0.01s
2026-08-04 16:20:32,181 INFO app.services.dce_processing.text_extractor: [OCR] Images debug sauvegardées dans: C:\sis_data\dce_extracted\debug_ocr_images\CPS - AO 33-2026
2026-08-04 16:20:32,203 INFO app.services.dce_processing.text_extractor: [OCR] Fichier: CPS - AO 33-2026.pdf
2026-08-04 16:20:32,203 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de pages: 14
2026-08-04 16:20:32,204 INFO app.services.dce_processing.text_extractor: [OCR] Taille: 2474.1 KB
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Page 1: 1653x2353 px, 806.6 KB, DPI: 200
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] === Page 1/14 ===
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: Non détectée
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
2026-08-04 16:20:32,815 INFO app.services.dce_processing.text_extractor: [DIAG] Chargement de PaddleOCR (lang=fr)...
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
WARNING: OMP_NUM_THREADS set to 4, not 1. The computation speed will not be optimized if you use data parallel. It will fail if this PaddlePaddle binary is compiled with OpenBlas since OpenBlas does not support multi-threads.
PLEASE USE OMP_NUM_THREADS WISELY.
Creating model: ('PP-OCRv6_medium_det', None, None)
Model files already exist. Using cached files. To redownload, please delete the directory manually: `C:\Users\nasri\.paddlex\official_models\PP-OCRv6_medium_det`.
Creating model: ('PP-OCRv6_medium_rec', None, None)
Model files already exist. Using cached files. To redownload, please delete the directory manually: `C:\Users\nasri\.paddlex\official_models\PP-OCRv6_medium_rec`.
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:48,998 INFO app.services.dce_processing.text_extractor: [DIAG] PaddleOCR (lang=fr) chargé avec succès.
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59739 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:53713 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:21:51,923 INFO app.services.dce_processing.text_extractor: [OCR] Image: page_1.png, Langue: fr
2026-08-04 16:21:51,924 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de résultats: 1
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Clés disponibles: ['input_path', 'page_index', 'doc_preprocessor_res', 'dt_polys', 'model_settings', 'text_det_params', 'text_type', 'text_rec_score_thresh', 'return_word_box', 'rec_texts', 'rec_scores', 'rec_polys', 'vis_fonts', 'textline_orientation_angles', 'rec_boxes']
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Confiance moyenne: 0.99
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Scores: [0.9832602739334106, 0.9934451580047607, 0.9992427229881287, 0.9804388880729675, 0.9871716499328613]...
2026-08-04 16:21:51,926 INFO app.services.dce_processing.text_extractor: [OCR] Texte extrait: 22 blocs, 970 caractères
2026-08-04 16:21:51,926 INFO app.services.dce_processing.text_extractor: [OCR] Aperçu texte: ROYAUME DU MAROC MINISTERE DELA JUSTICE...
2026-08-04 16:21:51,927 INFO app.services.dce_processing.text_extractor: [OCR] ← Résultat fr: 970 caractères
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Seuil 30 atteint, arrêt des tests
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante FIGÉE: fr (dès la page 1)
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Meilleur résultat page 1: fr (970 caractères)
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Page 1: 970 caractères écrits
2026-08-04 16:21:52,609 INFO app.services.dce_processing.text_extractor: [OCR] Page 2: 1650x2350 px, 1741.9 KB, DPI: 200
2026-08-04 16:21:52,610 INFO app.services.dce_processing.text_extractor: [OCR] === Page 2/14 ===
2026-08-04 16:21:52,610 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: fr
2026-08-04 16:21:52,611 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:21:52,611 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:56896 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:60793 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Image: page_2.png, Langue: fr
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de résultats: 1
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Clés disponibles: ['input_path', 'page_index', 'doc_preprocessor_res', 'dt_polys', 'model_settings', 'text_det_params', 'text_type', 'text_rec_score_thresh', 'return_word_box', 'rec_texts', 'rec_scores', 'rec_polys', 'vis_fonts', 'textline_orientation_angles', 'rec_boxes']
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Confiance moyenne: 0.99
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Scores: [0.9989684820175171, 0.969715416431427, 0.9798573851585388, 0.9888539910316467, 0.9910030364990234]...
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Texte extrait: 51 blocs, 2034 caractères
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Aperçu texte: PREAMBULE DU CAHIER DES PRESCRIPTIONS SPECIALES Marché n° ../2026 est passé par appel d'offres ouvert simplifié sur offre de prix (séance publique) en...
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] ← Résultat fr: 2034 caractères
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Seuil 30 atteint, arrêt des tests
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Meilleur résultat page 2: fr (2034 caractères)
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Page 2: 2034 caractères écrits
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] Page 3: 1653x2350 px, 1730.6 KB, DPI: 200
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] === Page 3/14 ===
2026-08-04 16:23:08,884 INFO a(sis_env) PS C:\Users\nasri\OneDrive\Desktop\Projects\SIS_Marches\backend> python -m uvicorn app.main:app --reload --port 8000
INFO:     Will watch for changes in these directories: ['C:\\Users\\nasri\\OneDrive\\Desktop\\Projects\\SIS_Marches\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [30520] using WatchFiles
INFO:     Started server process [5840]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     127.0.0.1:52566 - "GET /dce/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:49701 - "GET /contrats/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:50885 - "GET /sous-traitants/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /dce/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projet-equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:49701 - "GET /equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:50885 - "GET /contrats/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57455 - "GET /sous-traitants/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projet-equipe/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:63023 - "GET /projets/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:57749 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:52566 - "GET /projets/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:63023 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/91/telecharger-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/91 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/89/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "GET /appels-offres/149 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59321 - "OPTIONS /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "OPTIONS /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "POST /appels-offres/91/telecharger-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:62710 - "OPTIONS /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "POST /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
2026-08-04 16:20:29,950 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Début pipeline AO 149
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:29,974 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Téléchargement DCE : déjà disponible (0.00s)
2026-08-04 16:20:30,083 INFO app.services.dce_processing.dce_pipeline: [PIPELINE] Dézippage : 0.11s, 6 fichiers extraits
2026-08-04 16:20:30,087 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Acte d'engagement - AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:30,882 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 4704 caractères.
2026-08-04 16:20:30,883 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Avis d'appel d'offre - Ar - AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:31,198 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 1465 caractères.
2026-08-04 16:20:31,198 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : Avis d'appel d'offre - Fr -AO 33-2026.pdf (type: pdf)
2026-08-04 16:20:31,484 INFO app.services.dce_processing.text_extractor: [DIAG] Succès extraction PDF (pdfplumber) : 1795 caractères.
2026-08-04 16:20:31,485 INFO app.services.dce_processing.text_extractor: [DIAG] Pipeline d'extraction appelé pour : CPS - AO 33-2026.pdf (type: pdf)
INFO:     127.0.0.1:65377 - "POST /appels-offres/149/traiter-dce HTTP/1.1" 200 OK
2026-08-04 16:20:31,489 WARNING app.services.dce_processing.dce_pipeline: [DIAG] Traitement DCE déjà en cours pour AppelOffres 149 — appel ignoré.
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:31,549 WARNING app.services.dce_processing.text_extractor: [DIAG] PDF vide : probablement un PDF scanné (image).
2026-08-04 16:20:31,549 INFO app.services.dce_processing.text_extractor: [DIAG] Aucun texte natif — tentative OCR (PaddleOCR) pour CPS - AO 33-2026.pdf.
2026-08-04 16:20:31,557 INFO app.services.dce_processing.ocr_cache: [CACHE] MISS pour CPS - AO 33-2026.pdf (hash: da9e7d92...)
2026-08-04 16:20:31,557 INFO app.services.dce_processing.text_extractor: [CACHE] MISS : 0.01s
2026-08-04 16:20:32,181 INFO app.services.dce_processing.text_extractor: [OCR] Images debug sauvegardées dans: C:\sis_data\dce_extracted\debug_ocr_images\CPS - AO 33-2026
2026-08-04 16:20:32,203 INFO app.services.dce_processing.text_extractor: [OCR] Fichier: CPS - AO 33-2026.pdf
2026-08-04 16:20:32,203 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de pages: 14
2026-08-04 16:20:32,204 INFO app.services.dce_processing.text_extractor: [OCR] Taille: 2474.1 KB
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Page 1: 1653x2353 px, 806.6 KB, DPI: 200
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] === Page 1/14 ===
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: Non détectée
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:20:32,814 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
2026-08-04 16:20:32,815 INFO app.services.dce_processing.text_extractor: [DIAG] Chargement de PaddleOCR (lang=fr)...
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
WARNING: OMP_NUM_THREADS set to 4, not 1. The computation speed will not be optimized if you use data parallel. It will fail if this PaddlePaddle binary is compiled with OpenBlas since OpenBlas does not support multi-threads.
PLEASE USE OMP_NUM_THREADS WISELY.
Creating model: ('PP-OCRv6_medium_det', None, None)
Model files already exist. Using cached files. To redownload, please delete the directory manually: `C:\Users\nasri\.paddlex\official_models\PP-OCRv6_medium_det`.
Creating model: ('PP-OCRv6_medium_rec', None, None)
Model files already exist. Using cached files. To redownload, please delete the directory manually: `C:\Users\nasri\.paddlex\official_models\PP-OCRv6_medium_rec`.
INFO:     127.0.0.1:65377 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:20:48,998 INFO app.services.dce_processing.text_extractor: [DIAG] PaddleOCR (lang=fr) chargé avec succès.
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:59739 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:53713 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57172 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:21:51,923 INFO app.services.dce_processing.text_extractor: [OCR] Image: page_1.png, Langue: fr
2026-08-04 16:21:51,924 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de résultats: 1
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Clés disponibles: ['input_path', 'page_index', 'doc_preprocessor_res', 'dt_polys', 'model_settings', 'text_det_params', 'text_type', 'text_rec_score_thresh', 'return_word_box', 'rec_texts', 'rec_scores', 'rec_polys', 'vis_fonts', 'textline_orientation_angles', 'rec_boxes']
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Confiance moyenne: 0.99
2026-08-04 16:21:51,925 INFO app.services.dce_processing.text_extractor: [OCR] Scores: [0.9832602739334106, 0.9934451580047607, 0.9992427229881287, 0.9804388880729675, 0.9871716499328613]...
2026-08-04 16:21:51,926 INFO app.services.dce_processing.text_extractor: [OCR] Texte extrait: 22 blocs, 970 caractères
2026-08-04 16:21:51,926 INFO app.services.dce_processing.text_extractor: [OCR] Aperçu texte: ROYAUME DU MAROC MINISTERE DELA JUSTICE...
2026-08-04 16:21:51,927 INFO app.services.dce_processing.text_extractor: [OCR] ← Résultat fr: 970 caractères
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Seuil 30 atteint, arrêt des tests
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante FIGÉE: fr (dès la page 1)
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Meilleur résultat page 1: fr (970 caractères)
2026-08-04 16:21:51,928 INFO app.services.dce_processing.text_extractor: [OCR] Page 1: 970 caractères écrits
2026-08-04 16:21:52,609 INFO app.services.dce_processing.text_extractor: [OCR] Page 2: 1650x2350 px, 1741.9 KB, DPI: 200
2026-08-04 16:21:52,610 INFO app.services.dce_processing.text_extractor: [OCR] === Page 2/14 ===
2026-08-04 16:21:52,610 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: fr
2026-08-04 16:21:52,611 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:21:52,611 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
INFO:     127.0.0.1:57257 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:56896 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:52865 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:60793 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Image: page_2.png, Langue: fr
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de résultats: 1
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Clés disponibles: ['input_path', 'page_index', 'doc_preprocessor_res', 'dt_polys', 'model_settings', 'text_det_params', 'text_type', 'text_rec_score_thresh', 'return_word_box', 'rec_texts', 'rec_scores', 'rec_polys', 'vis_fonts', 'textline_orientation_angles', 'rec_boxes']
2026-08-04 16:23:08,212 INFO app.services.dce_processing.text_extractor: [OCR] Confiance moyenne: 0.99
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Scores: [0.9989684820175171, 0.969715416431427, 0.9798573851585388, 0.9888539910316467, 0.9910030364990234]...
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Texte extrait: 51 blocs, 2034 caractères
2026-08-04 16:23:08,213 INFO app.services.dce_processing.text_extractor: [OCR] Aperçu texte: PREAMBULE DU CAHIER DES PRESCRIPTIONS SPECIALES Marché n° ../2026 est passé par appel d'offres ouvert simplifié sur offre de prix (séance publique) en...
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] ← Résultat fr: 2034 caractères
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Seuil 30 atteint, arrêt des tests
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Meilleur résultat page 2: fr (2034 caractères)
2026-08-04 16:23:08,214 INFO app.services.dce_processing.text_extractor: [OCR] Page 2: 2034 caractères écrits
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] Page 3: 1653x2350 px, 1730.6 KB, DPI: 200
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] === Page 3/14 ===
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: fr
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:61535 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:64845 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:64845 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:58573 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:58573 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:58573 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:51662 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:51662 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
INFO:     127.0.0.1:51662 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
2026-08-04 16:24:28,092 INFO app.services.dce_processing.text_extractor: [OCR] Image: page_3.png, Langue: fr
2026-08-04 16:24:28,092 INFO app.services.dce_processing.text_extractor: [OCR] Nombre de résultats: 1
2026-08-04 16:24:28,092 INFO app.services.dce_processing.text_extractor: [OCR] Clés disponibles: ['input_path', 'page_index', 'doc_preprocessor_res', 'dt_polys', 'model_settings', 'text_det_params', 'text_type', 'text_rec_score_thresh', 'return_word_box', 'rec_texts', 'rec_scores', 'rec_polys', 'vis_fonts', 'textline_orientation_angles', 'rec_boxes']
2026-08-04 16:24:28,092 INFO app.services.dce_processing.text_extractor: [OCR] Confiance moyenne: 0.97
2026-08-04 16:24:28,093 INFO app.services.dce_processing.text_extractor: [OCR] Scores: [0.9994538426399231, 0.9802644848823547, 0.9968249201774597, 0.9972633719444275, 0.9830560088157654]...
2026-08-04 16:24:28,093 INFO app.services.dce_processing.text_extractor: [OCR] Texte extrait: 56 blocs, 1848 caractères
2026-08-04 16:24:28,093 INFO app.services.dce_processing.text_extractor: [OCR] Aperçu texte: B. Pour les personnes morales 1)- Cas des sociétés :...
2026-08-04 16:24:28,094 INFO app.services.dce_processing.text_extractor: [OCR] ← Résultat fr: 1848 caractères
2026-08-04 16:24:28,094 INFO app.services.dce_processing.text_extractor: [OCR] Seuil 30 atteint, arrêt des tests
2026-08-04 16:24:28,094 INFO app.services.dce_processing.text_extractor: [OCR] Meilleur résultat page 3: fr (1848 caractères)
2026-08-04 16:24:28,094 INFO app.services.dce_processing.text_extractor: [OCR] Page 3: 1848 caractères écrits
2026-08-04 16:24:28,855 INFO app.services.dce_processing.text_extractor: [OCR] Page 4: 1650x2348 px, 2293.8 KB, DPI: 200
2026-08-04 16:24:28,855 INFO app.services.dce_processing.text_extractor: [OCR] === Page 4/14 ===
2026-08-04 16:24:28,855 INFO app.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: fr
2026-08-04 16:24:28,856 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:24:28,856 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
INFO:     127.0.0.1:51662 - "GET /appels-offres/149/analyse-dce HTTP/1.1" 200 OK
pp.services.dce_processing.text_extractor: [OCR] Langue dominante actuelle: fr
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] Ordre des langues à tester: ['fr', 'ar']
2026-08-04 16:23:08,884 INFO app.services.dce_processing.text_extractor: [OCR] → Test langue: fr
