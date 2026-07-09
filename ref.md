<<<<<<< HEAD

=======
Contexte : stage IA/Data Science chez SIS Consultants (cabinet de conseil B2B, Maroc). 
L'app de gestion Phase 1 (React + FastAPI, "SIS Suivi Marchés") est stabilisée dans 
d'autres sessions séparées. CETTE SESSION EST UN PROJET DATA SCIENCE INDÉPENDANT — pas 
du code à intégrer dans l'app principale, un pilote exploratoire séparé, dans son propre 
dossier/repo.

BUT GÉNÉRAL DE CETTE PHASE : construire et évaluer un pipeline d'extraction automatique 
d'informations structurées depuis un DCE (Dossier de Consultation des Entreprises, 
document administratif marocain), en le comparant à une saisie manuelle de référence 
(déjà possible dans l'app Phase 1, onglet DCE de chaque projet).

ARBORESCENCE À CRÉER (dossier séparé, ex: sis-data-science/, à la racine, à côté de 
backend/ et frontend/ mais indépendant) :

sis-data-science/
├── README.md                          # but du projet, comment lancer les notebooks
├── requirements.txt
├── .env.example                       # placeholder clé API (jamais la vraie clé committée)
│
├── data/
│   ├── raw/                           # DCE bruts (PDF téléchargés manuellement ou 
│   │                                    synthétiques générés), jamais de données 
│   │                                    confidentielles SIS ici — uniquement des DCE 
│   │                                    publics ou générés
│   ├── processed/                     # texte extrait/nettoyé des PDF, format 
│   │                                    intermédiaire réutilisable entre notebooks
│   └── ground_truth/                  # fiches DCE de référence (JSON/CSV), remplies 
│                                        à la main, servent à évaluer la qualité de 
│                                        l'extraction automatique
│
├── notebooks/
│   ├── 01_exploration_dce.ipynb       # comprendre la structure/variabilité réelle des 
│   │                                    DCE marocains : mise en page, sections 
│   │                                    récurrentes, difficultés attendues pour 
│   │                                    l'extraction
│   ├── 02_extraction_llm.ipynb        # construire et tester le pipeline d'extraction 
│   │                                    structurée via LLM (function calling / sortie 
│   │                                    JSON forcée) sur les champs : objet, organisme, 
│   │                                    montant_estimatif, date_limite_remise, 
│   │                                    type_procedure, pieces_exigees
│   ├── 03_evaluation_extraction.ipynb # comparer les extractions automatiques aux 
│   │                                    fiches ground_truth, calculer des métriques 
│   │                                    simples (taux de champs corrects, précision par 
│   │                                    champ)
│   ├── 04_similarite_embeddings.ipynb # (Brique B, à ne démarrer qu'après validation de 
│   │                                    01-03) prototype de recherche de projets 
│   │                                    similaires par embeddings sur le texte "objet" 
│   │                                    des DCE
│   └── 05_synthese_resultats.ipynb    # notebook de synthèse/présentation des résultats, 
│                                        pensé pour être montré tel quel à l'encadrant
│
└── src/
    ├── extraction.py                  # fonctions réutilisables d'extraction (appelées 
    │                                    par les notebooks, pas de logique dupliquée 
    │                                    entre notebooks)
    ├── embeddings.py                  # fonctions réutilisables pour la similarité
    └── utils.py                       # chargement/nettoyage de PDF, fonctions communes

RÈGLE IMPORTANTE : chaque notebook doit rester lisible et concis — la vraie logique va 
dans src/*.py, les notebooks orchestrent et visualisent, ils n'accumulent pas de fonctions 
longues copiées-collées.

DONNÉES DE DÉPART : pas encore de vrais DCE disponibles (confidentialité SIS). Pour 
démarrer 01_exploration_dce.ipynb, propose comment constituer un premier petit corpus 
avec :
1. Quelques DCE réels téléchargés manuellement et ponctuellement par moi-même sur 
   marchespublics.gouv.ma (consultation humaine normale, pas de scraping automatisé), OU
2. Des DCE synthétiques réalistes que tu génères toi-même en attendant

TÂCHE IMMÉDIATE : crée l'arborescence ci-dessus, un README.md expliquant le but et 
comment lancer les notebooks, puis propose une approche pour 01_exploration_dce.ipynb 
AVANT d'écrire du code — on discute d'abord.

Une fois 01-03 validés et fonctionnels, on décidera ensemble si on enchaîne sur 
04_similarite_embeddings.ipynb.

On avance étape par étape, tu me proposes une approche avant de coder, on discute avant 
que tu codes quoi que ce soit.
>>>>>>> fe7bbbc (interface updates)
