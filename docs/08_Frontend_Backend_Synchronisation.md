# Frontend - Backend Synchronisation

## 1. Nouveau Workflow Métier

### Cycle complet d'un marché public

```
MARCHÉ PUBLIC (Veille)
    ↓
ANALYSE IA (automatique ou manuelle)
    ↓
"JE SUIS INTÉRESSÉ" (action utilisateur)
    ↓
MIGRATION AUTOMATIQUE AO → OPPORTUNITÉ
    ↓
OPPORTUNITÉ D'AFFAIRES
    ├→ PRÉPARATION DU DOSSIER
    │   ├── Checklist pièces
    │   ├── Documents administratifs
    │   ├── Réponses aux critères
    │   └── Progression dossier
    │
    ├→ DOSSIER DÉPOSÉ (action utilisateur)
    │
    └→ DÉCISION
        ├── REJETÉE → migration vers "Opportunités rejetées"
        ├── IGNORÉE → migration vers "Opportunités ignorées"
        └── GAGNÉE → migration automatique vers PROJET
                ↓
                MIGRATION AUTOMATIQUE OPPORTUNITÉ → PROJET
                ↓
                SUIVI DE PROJET
                ├── EXÉCUTION
                │   ├── Équipe affectée
                │   ├── Sous-traitants mobilisés
                │   ├── Contrats signés
                │   ├── Livrables en cours
                │   └── Documents de suivi
                │
                └→ CLÔTURE
                    ├── Archivage
                    ├── Bilan
                    └── Historique conservé
```

### États du workflow

**Appel d'Offres** :
- `nouveau` : Importé automatiquement
- `analyse` : Analyse IA en cours/terminée
- `interesse` : Marqué "intéressé" par utilisateur
- `ignore` : Ignoré par utilisateur

**Opportunité** :
- `interesse` : Créée depuis AO
- `en_preparation` : Dossier en préparation
- `pret_a_deposer` : Dossier prêt à déposer (checklist complète)
- `soumis` : Offre déposée
- `gagne` : Marché gagné (prêt à migrer vers projet)
- `perdu` : Marché perdu
- `abandonne` : Abandonné par utilisateur
- `ignore` : Ignoré (nouvel état)

**Projet** :
- `en_execution` : En cours d'exécution
- `actif` : Actif
- `suspendu` : Suspendu temporairement
- `termine` : Terminé/clôturé

## 2. Données Attendues du Backend par Écran

### 2.1 Écran : Marchés Publics (Veille)

**Données nécessaires par AO** :
```json
{
  "id": 1,
  "reference": "AO-2025-001",
  "objet": "Travaux de rénovation...",
  "organisme": "Mairie de Paris",
  "date_limite_remise": "2025-06-30",
  "montant_estimatif": 150000,
  "type_procedure": "Appel d'offres ouvert",
  "url_avis": "https://...",
  "url_cps": "https://...", // URL du DCE téléchargé
  "dce_statut": "TELECHARGE", // NON_TELECHARGE | TELECHARGEMENT | TELECHARGE | ERREUR
  "dce_erreur": null,
  "statut": "nouveau", // nouveau | analyse | interesse | ignore
  "date_import": "2025-05-15T10:30:00Z",
  "ref_consultation": "2025-12345",
  "org_acronyme": "MP75",
  
  // NOUVEAUX CHAMPS
  "a_analyse_dce": true, // si une analyse existe
  "score_compatibilite": 75, // score IA si analysé
  "date_interet": null, // quand marqué intéressé
  "date_conversion_projet": null // quand converti en projet
}
```

### 2.2 Écran : Opportunités d'affaires

**Données nécessaires par opportunité** :
```json
{
  "id": 1,
  "nom": "Rénovation bâtiment communal",
  "client": "Mairie de Paris",
  "lieu": "Paris 15e",
  "description": "Travaux de rénovation...",
  "budget": 150000,
  "budget_engage": 0,
  "debut": "2025-07-01",
  "fin": "2025-12-31",
  "chef": "Jean Dupont",
  "chef_id": 5,
  
  // Workflow
  "workflow_state": "opportunite", // opportunite | projet
  "statut": "en_preparation", // interesse | en_preparation | pret_a_deposer | soumis | gagne | perdu | abandonne | ignore
  "date_soumission": null,
  "date_conversion": null,
  
  // Lien AO d'origine
  "appel_offres_id": 1,
  "origine": "appel_offres", // appel_offres | manuel
  "url_avis": "https://...",
  
  // NOUVEAUX CHAMPS - Données enrichies depuis AO
  "organisme": "Mairie de Paris",
  "date_limite_ao": "2025-06-30",
  "type_procedure": "Appel d'offres ouvert",
  "montant_estimatif": 150000,
  
  // NOUVEAUX CHAMPS - Progression dossier
  "progression_dossier": {
    "completion": 45, // pourcentage
    "pieces_preparees": 8,
    "pieces_requises": 15,
    "documents_admin": 3,
    "documents_techniques": 5,
    "derniere_action": "Ajout document technique",
    "derniere_action_date": "2025-05-20T14:30:00Z"
  },
  
  // NOUVEAUX CHAMPS - Analyse IA
  "analyse_dce": {
    "resume": "Projet de rénovation...",
    "mots_cles": ["rénovation", "bâtiment", "public"],
    "technologies_detectees": ["BIM", "BTP"],
    "score_compatibilite": 75,
    "score_recommandation": 82,
    "recommandations": ["Compétences BTP requises", "Matériel spécifique"],
    "contraintes": ["Délai serré", "Normes environnementales"],
    "pieces_manquantes": ["Attestation assurance", "Certificat capacité"]
  },
  
  // NOUVEAUX CHAMPS - Documents DCE
  "documents_dce": [
    {
      "id": 1,
      "nom": "Règlement consultation",
      "type": "reglement",
      "date": "2025-05-10",
      "url": "https://..."
    },
    {
      "id": 2,
      "nom": "Cahier charges",
      "type": "cahier_charges",
      "date": "2025-05-10",
      "url": "https://..."
    }
  ],
  
  // NOUVEAUX CHAMPS - Checklist
  "checklist_dossier": [
    {
      "id": 1,
      "item": "Attestation URSSAF",
      "requis": true,
      "fourni": true,
      "date_fourniture": "2025-05-18"
    },
    {
      "id": 2,
      "item": "Certificat capacité",
      "requis": true,
      "fourni": false,
      "date_fourniture": null
    }
  ],
  
  // Métadonnées
  "date_creation": "2025-05-15T10:30:00Z",
  "date_modification": "2025-05-20T14:30:00Z"
}
```

### 2.3 Écran : Suivi de Projet

**Données nécessaires par projet** :
```json
{
  "id": 1,
  "nom": "Rénovation bâtiment communal",
  "client": "Mairie de Paris",
  "lieu": "Paris 15e",
  "description": "Travaux de rénovation...",
  "budget": 150000,
  "budget_engage": 45000,
  "debut": "2025-07-01",
  "fin": "2025-12-31",
  "chef": "Jean Dupont",
  "chef_id": 5,
  
  // Workflow
  "workflow_state": "projet",
  "statut": "en_execution",
  "date_conversion": "2025-06-15T10:00:00Z",
  
  // NOUVEAUX CHAMPS - Avancement
  "avancement_global": 35, // pourcentage
  "avancement_detaille": {
    "planning": 40,
    "equipe": 60,
    "documents": 30,
    "contrats": 50,
    "livrables": 20
  },
  
  // NOUVEAUX CHAMPS - Équipe
  "equipe": [
    {
      "id": 5,
      "nom": "Jean Dupont",
      "role": "Chef de projet",
      "intitule": "Chef de projet",
      "type": "interne",
      "email": "jean.dupont@sis.com",
      "photo": "https://...",
      "disponibilite": "active",
      "taux_implication": 100
    },
    {
      "id": 8,
      "nom": "Marie Martin",
      "role": "Ingénieur BTP",
      "intitule": "Ingénieur",
      "type": "interne",
      "email": "marie.martin@sis.com",
      "photo": "https://...",
      "disponibilite": "active",
      "taux_implication": 80
    }
  ],
  
  // NOUVEAUX CHAMPS - Planning
  "planning": {
    "jalons": [
      {
        "id": 1,
        "nom": "Démarrage",
        "date_prevue": "2025-07-01",
        "date_reelle": "2025-07-01",
        "statut": "completed"
      },
      {
        "id": 2,
        "nom": "Livraison 1",
        "date_prevue": "2025-09-15",
        "date_reelle": null,
        "statut": "in_progress"
      },
      {
        "id": 3,
        "nom": "Livraison 2",
        "date_prevue": "2025-11-30",
        "date_reelle": null,
        "statut": "pending"
      },
      {
        "id": 4,
        "nom": "Fin projet",
        "date_prevue": "2025-12-31",
        "date_reelle": null,
        "statut": "pending"
      }
    ],
    "avancement_planning": 35
  },
  
  // NOUVEAUX CHAMPS - Sous-traitants
  "sous_traitants": [
    {
      "id": 3,
      "nom": "ABC SARL",
      "specialite": "Maçonnerie",
      "contact": "Pierre Durand",
      "email": "contact@abc-sarl.fr",
      "contrats": [
        {
          "id": 1,
          "reference": "CT-2025-014",
          "montant": 25000,
          "statut": "actif",
          "date_debut": "2025-07-01",
          "date_fin": "2025-09-30"
        }
      ]
    }
  ],
  
  // NOUVEAUX CHAMPS - Contrats
  "contrats": [
    {
      "id": 1,
      "reference": "CT-2025-014",
      "sous_traitant_id": 3,
      "sous_traitant_nom": "ABC SARL",
      "montant": 25000,
      "date_debut": "2025-07-01",
      "date_fin": "2025-09-30",
      "date_signature": "2025-06-20",
      "statut": "actif",
      "avenants": []
    }
  ],
  
  // NOUVEAUX CHAMPS - Documents
  "documents": [
    {
      "id": 1,
      "nom": "Plan architecte",
      "type": "plan",
      "date": "2025-06-10",
      "auteur": "Jean Dupont",
      "url": "https://...",
      "version": "v1.2"
    },
    {
      "id": 2,
      "nom": "Devis détaillé",
      "type": "devis",
      "date": "2025-06-15",
      "auteur": "Marie Martin",
      "url": "https://...",
      "version": "v1.0"
    }
  ],
  
  // NOUVEAUX CHAMPS - Livrables
  "livrables": [
    {
      "id": 1,
      "titre": "Livraison 1 - Gros œuvre",
      "description": "Fondations et structure",
      "type_livrable": "phase",
      "date_prevue": "2025-09-15",
      "date_livraison": null,
      "statut": "en_cours",
      "progression": 60
    },
    {
      "id": 2,
      "titre": "Livraison 2 - Finitions",
      "description": "Revêtements et aménagements",
      "type_livrable": "phase",
      "date_prevue": "2025-11-30",
      "date_livraison": null,
      "statut": "pending",
      "progression": 0
    }
  ],
  
  // NOUVEAUX CHAMPS - Échéances
  "echeances": [
    {
      "id": 1,
      "type": "jalon",
      "titre": "Livraison 1",
      "date": "2025-09-15",
      "priorite": "normale",
      "statut": "a_venir"
    },
    {
      "id": 2,
      "type": "contrat",
      "titre": "Renouvellement contrat ABC",
      "date": "2025-09-30",
      "priorite": "haute",
      "statut": "a_venir"
    },
    {
      "id": 3,
      "type": "administratif",
      "titre": "Rapport mensuel",
      "date": "2025-07-31",
      "priorite": "haute",
      "statut": "urgent"
    }
  ],
  
  // NOUVEAUX CHAMPS - KPIs
  "kpis": {
    "budget_consomme": 45000,
    "budget_restant": 105000,
    "taux_consommation": 30,
    "jours_ecoules": 45,
    "jours_restants": 180,
    "taux_avancement": 35,
    "risques": 2,
    "bloquants": 0
  },
  
  // Métadonnées
  "date_creation": "2025-06-15T10:00:00Z",
  "date_modification": "2025-07-20T14:30:00Z",
  "derniere_activite": "2025-07-20T14:30:00Z"
}
```

### 2.4 Écran : Détail Opportunité/Projet

**Données supplémentaires nécessaires** :
- Historique complet (timeline)
- Documents avec versioning
- Communications internes
- Notes et commentaires

## 3. Nouveaux Endpoints REST

### 3.1 Endpoints Opportunités

**Migration AO → Opportunité** :
```http
POST /appels-offres/{id}/interesser
Body: {
  "nom": "Nom personnalisé (optionnel)",
  "chef_id": 5 (optionnel)
}
Response: Opportunité créée avec toutes les données migrées
```

**Changement de statut opportunité** :
```http
PUT /projets/{id}/statut
Body: {
  "statut": "soumis" | "gagne" | "perdu" | "ignore" | "abandonne"
}
Response: Projet mis à jour + événement créé
```

**Migration Opportunité → Projet** :
```http
POST /projets/{id}/convertir-en-projet
Body: {
  "date_debut": "2025-07-01",
  "date_fin": "2025-12-31"
}
Response: Projet converti + événements créés
```

**Récupération progression dossier** :
```http
GET /projets/{id}/progression-dossier
Response: {
  "completion": 45,
  "pieces_preparees": 8,
  "pieces_requises": 15,
  "checklist": [...]
}
```

**Mise à jour progression dossier** :
```http
PUT /projets/{id}/progression-dossier
Body: {
  "checklist_item_id": 2,
  "fourni": true
}
Response: Progression mise à jour

**Récupération checklist** :
```http
GET /projets/{id}/checklist
Response: {
  "items": [...],
  "completion": 45
}
```

**Récupération documents DCE** :
```http
GET /projets/{id}/documents-dce
Response: {
  "documents": [...]
}
```

### 3.2 Endpoints Projets

**Récupération dashboard projet** :
```http
GET /projets/{id}/dashboard
Response: {
  "kpis": {...},
  "equipe": [...],
  "planning": {...},
  "contrats": [...],
  "documents": [...],
  "echeances": [...],
  "livrables": [...]
}
```

**Récupération historique** :
```http
GET /evenements/{entite_type}/{entite_id}
Response: {
  "evenements": [...]
}
```

**Mise à jour avancement** :
```http
PUT /projets/{id}/avancement
Body: {
  "avancement_global": 40,
  "avancement_detaille": {...}
}
Response: Projet mis à jour

**Gestion livrables** :
```http
POST /projets/{id}/livrables
GET /projets/{id}/livrables
PUT /livrables/{id}
DELETE /livrables/{id}
```

**Gestion planning/jalons** :
```http
POST /projets/{id}/jalons
GET /projets/{id}/jalons
PUT /jalons/{id}
DELETE /jalons/{id}
```

### 3.3 Endpoints Historique

**Récupération événements récents** :
```http
GET /evenements/recent?limit=50
Response: {
  "evenements": [...]
}
```

**Récupération par entité** :
```http
GET /evenements/{entite_type}/{entite_id}
Response: {
  "evenements": [...]
}
```

## 4. Modifications du Modèle de Données

### 4.1 Table `projets` - Nouvelles colonnes

```sql
-- Workflow et progression
ALTER TABLE projets ADD COLUMN workflow_state VARCHAR(20) NOT NULL DEFAULT 'opportunite';
ALTER TABLE projets ADD COLUMN date_conversion TIMESTAMP;
ALTER TABLE projets ADD COLUMN avancement_global INTEGER DEFAULT 0;

-- Données enrichies depuis AO
ALTER TABLE projets ADD COLUMN organisme VARCHAR(255);
ALTER TABLE projets ADD COLUMN date_limite_ao DATE;
ALTER TABLE projets ADD COLUMN type_procedure VARCHAR(100);
ALTER TABLE projets ADD COLUMN montant_estimatif FLOAT;

-- Progression dossier
ALTER TABLE projets ADD COLUMN progression_dossier JSON; -- {completion, pieces_preparees, pieces_requises, ...}

-- Avancement détaillé
ALTER TABLE projets ADD COLUMN avancement_detaille JSON; -- {planning, equipe, documents, contrats, livrables}

-- Métadonnées
ALTER TABLE projets ADD COLUMN date_modification TIMESTAMP;
ALTER TABLE projets ADD COLUMN derniere_activite TIMESTAMP;
```

### 4.2 Nouvelle table `checklist_dossier`

```sql
CREATE TABLE checklist_dossier (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    requis BOOLEAN NOT NULL DEFAULT true,
    fourni BOOLEAN NOT NULL DEFAULT false,
    date_fourniture TIMESTAMP,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checklist_projet ON checklist_dossier(projet_id);
```

### 4.3 Nouvelle table `jalons`

```sql
CREATE TABLE jalons (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    date_prevue DATE NOT NULL,
    date_reelle DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, delayed
    description TEXT,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jalons_projet ON jalons(projet_id);
```

### 4.4 Nouvelle table `livrables`

```sql
CREATE TABLE livrables (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    contrat_id INTEGER REFERENCES contrats(id) ON DELETE SET NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_livrable VARCHAR(50), -- phase, document, rapport
    date_prevue DATE,
    date_livraison DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente', -- en_attente, en_cours, termine, annule
    progression INTEGER DEFAULT 0,
    document_nom VARCHAR(255),
    document_path VARCHAR(500),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_livrables_projet ON livrables(projet_id);
CREATE INDEX idx_livrables_contrat ON livrables(contrat_id);
```

### 4.5 Nouvelle table `echeances`

```sql
CREATE TABLE echeances (
    id SERIAL PRIMARY KEY,
    projet_id INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- jalon, contrat, administratif, rapport
    titre VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    priorite VARCHAR(20) NOT NULL DEFAULT 'normale', -- basse, normale, haute, urgente
    statut VARCHAR(20) NOT NULL DEFAULT 'a_venir', -- passe, a_venir, urgent, depasse
    description TEXT,
    resolue BOOLEAN DEFAULT false,
    date_resolution TIMESTAMP,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_echeances_projet ON echeances(projet_id);
CREATE INDEX idx_echeances_date ON echeances(date);
```

### 4.6 Table `appels_offres` - Nouvelles colonnes

```sql
-- Suivi workflow
ALTER TABLE appels_offres ADD COLUMN date_interet TIMESTAMP;
ALTER TABLE appels_offres ADD COLUMN date_conversion_projet TIMESTAMP;

-- Analyse IA
ALTER TABLE appels_offres ADD COLUMN score_compatibilite INTEGER;
```

### 4.7 Table `evenements` - Enrichissement

```sql
-- La table existe déjà, mais s'assurer qu'elle a tous les champs nécessaires
ALTER TABLE evenements ADD COLUMN ip_address VARCHAR(50);
ALTER TABLE evenements ADD COLUMN user_agent VARCHAR(255);
```

## 5. Historique Automatique - Événements à Enregistrer

### 5.1 Événements Appel d'Offres

```python
# Création/Automatique
"ao_importe" = "AO détecté et importé depuis le portail"
"ao_synchronise" = "AO synchronisé depuis le portail"
"ao_erreur_sync" = "Erreur lors de la synchronisation AO"

# Analyse IA
"ao_analyse_demarrée" = "Analyse IA démarrée"
"ao_analyse_terminee" = "Analyse IA terminée avec score X"

# Téléchargement DCE
"ao_dce_telecharge" = "DCE téléchargé depuis le portail"
"ao_dce_erreur" = "Erreur lors du téléchargement DCE"

# Actions utilisateur
"ao_interet_marque" = "Intérêt marqué pour cet AO"
"ao_ignorer" = "AO ignoré"
"ao_reactiver" = "AO réactivé"
```

### 5.2 Événements Opportunité

```python
# Création
"opportunite_cree_ao" = "Opportunité créée depuis AO"
"opportunite_cree_manuel" = "Opportunité créée manuellement"
"opportunite_analyse_importee" = "Analyse IA importée depuis AO"

# Progression dossier
"opportunite_piece_ajoutee" = "Pièce ajoutée au dossier"
"opportunite_piece_validee" = "Pièce validée"
"opportunite_document_ajoute" = "Document ajouté"
"opportunite_checklist_progression" = "Progression checklist : X%"

# Changements de statut
"opportunite_statut_interesse" = "Statut changé : Intéressé"
"opportunite_statut_preparation" = "Statut changé : En préparation"
"opportunite_statut_soumis" = "Statut changé : Offre déposée"
"opportunite_statut_gagne" = "Statut changé : Gagnée"
"opportunite_statut_perdu" = "Statut changé : Rejetée"
"opportunite_statut_abandonne" = "Statut changé : Abandonnée"
"opportunite_statut_ignore" = "Statut changé : Ignorée"

# Conversion
"opportunite_convertie_projet" = "Opportunité convertie en projet"

# Modifications
"opportunite_modifiee" = "Opportunité modifiée"
"opportunite_info_change" = "Informations générales modifiées"
"opportunite_equipe_assignee" = "Membre équipe assigné"
```

### 5.3 Événements Projet

```python
# Création
"projet_cree" = "Projet créé"
"projet_cree_ao" = "Projet créé depuis AO"
"projet_cree_opportunite" = "Projet créé depuis opportunité"

# Équipe
"projet_equipe_affectee" = "Membre d'équipe affecté"
"projet_equipe_retiree" = "Membre d'équipe retiré"
"projet_equipe_modifiee" = "Composition équipe modifiée"

# Sous-traitants
"projet_sous_traitant_ajoute" = "Sous-traitant ajouté"
"projet_sous_traitant_retire" = "Sous-traitant retiré"

# Contrats
"projet_contrat_cree" = "Contrat créé"
"projet_contrat_signe" = "Contrat signé"
"projet_contrat_resilie" = "Contrat résilié"
"projet_contrat_renouvelle" = "Contrat renouvelé"
"projet_avenant_signe" = "Avenant signé"

# Documents
"projet_document_ajoute" = "Document ajouté"
"projet_document_modifie" = "Document modifié"
"projet_document_supprime" = "Document supprimé"
"projet_document_version" = "Nouvelle version document"

# Livrables
"projet_livrable_cree" = "Livrable créé"
"projet_livrable_envoye" = "Livrable envoyé"
"projet_livrable_valide" = "Livrable validé"
"projet_livrable_refuse" = "Livrable refusé"

# Planning
"projet_jalon_cree" = "Jalon créé"
"projet_jalon_atteint" = "Jalon atteint"
"projet_jalon_reporte" = "Jalon reporté"

# Avancement
"projet_avancement_modifie" = "Avancement modifié : X%"
"projet_phase_changee" = "Phase changée"

# Statut
"projet_statut_en_execution" = "Statut changé : En exécution"
"projet_statut_actif" = "Statut changé : Actif"
"projet_statut_suspendu" = "Statut changé : Suspendu"
"projet_statut_termine" = "Statut changé : Terminé"

# Échéances
"projet_echeance_atteinte" = "Échéance atteinte"
"projet_echeance_resolue" = "Échéance résolue"
"projet_echeance_depassee" = "Échéance dépassée"

# Modifications générales
"projet_modifie" = "Projet modifié"
"projet_info_change" = "Informations générales modifiées"
"projet_budget_change" = "Budget modifié"
"projet_planning_change" = "Planning modifié"
```

### 5.4 Événements Système

```python
# Authentification
"utilisateur_connecte" = "Utilisateur connecté"
"utilisateur_deconnecte" = "Utilisateur déconnecté"

# Erreurs
"erreur_import_ao" = "Erreur lors de l'import AO"
"erreur_analyse_ia" = "Erreur lors de l'analyse IA"
"erreur_migration" = "Erreur lors de la migration"
```

## 6. Ce qui Reste Entièrement Côté Frontend

### 6.1 Layout et Navigation
- **Layout hybride** (liste + preview latéral)
- **Sidebar navigation** (organisation des modules)
- **Breadcrumb contextuel** (chemin de navigation)
- **WorkflowProgress** (indicateur visuel de progression)
- **Responsive design** (adaptation mobile)

### 6.2 Composants UI
- **OpportuniteCard** (carte enrichie avec toutes les infos)
- **ProjetHeader** (header projet avec méta)
- **KPICard** (cartes KPI modernisées)
- **ProgressBar** (barres de progression)
- **StatutBadge** (badges de statut avec variantes)
- **ActionButton** (boutons d'action rapides)
- **QuickActions** (menu d'actions inline)
- **Widget** (container générique pour widgets)

### 6.3 Widgets Dashboard
- **PlanningWidget** (widget planning/jalons)
- **EquipeWidget** (widget équipe)
- **ContratsWidget** (widget contrats)
- **DocumentsWidget** (widget documents)
- **EcheancesWidget** (widget échéances)
- **KPIsWidget** (widget KPIs)
- **TimelineWidget** (widget timeline)

### 6.4 Timeline et Historique
- **Timeline** (composant timeline verticale)
- **TimelineEvent** (événement individuel)
- **TimelineIcon** (icône événement)
- **Animation timeline** (transitions fluides)

### 6.5 Animations et Transitions
- **Fade in/out** (transitions pages)
- **Slide effects** (animations widgets)
- **Hover effects** (interactions cartes)
- **Loading states** (états de chargement)
- **Skeleton screens** (squelettes de chargement)

### 6.6 Design System
- **Couleurs** (palette complète)
- **Typography** (hiérarchie typographique)
- **Spacing** (système d'espacement)
- **Shadows** (ombres et profondeur)
- **Borders** (bordures et séparation)
- **Icons** (icônes Lucide React)

### 6.7 États et Interactions
- **States React** (gestion d'état local)
- **Form validation** (validation formulaires)
- **Error handling** (gestion erreurs)
- **Success feedback** (retour succès)
- **Modal dialogs** (boîtes de dialogue)
- **Toasts notifications** (notifications)

### 6.8 Performance
- **Lazy loading** (chargement différé composants)
- **Code splitting** (division du code)
- **Memoization** (optimisation rendu)
- **Virtual scrolling** (scroll virtuel listes)
- **Debouncing** (débounce recherche)

## 7. Priorités d'Implémentation Backend

### Phase 1 : Critique (session immédiate)
1. **Migrations tables** : Nouvelles colonnes et tables
2. **Endpoints statut** : Changement de statut avec événements
3. **Endpoint conversion** : AO → Opportunité → Projet
4. **Service événements** : Création automatique d'événements
5. **Enrichissement données** : Migration intelligente AO → Opportunité

### Phase 2 : Important (session suivante)
1. **Endpoint dashboard** : Récupération données projet dashboard
2. **Endpoints checklist** : Gestion checklist progression
3. **Endpoints jalons** : Gestion planning/jalons
4. **Endpoints livrables** : Gestion livrables
5. **Endpoints echeances** : Gestion échéances

### Phase 3 : Améliorations (sessions futures)
1. **Optimisation performances** : Index, cache, requêtes
2. **Notifications** : Système de notifications
3. **Rapports** : Génération rapports
4. **Export** : Export données
5. **API avancée** : Filtres, recherche, tri avancé

## 8. Checklist pour Développeur Backend

### Pré-requis
- [ ] Lire la spécification workflow complet
- [ ] Comprendre le cycle métier AO → Opportunité → Projet
- [ ] Identifier les points de migration automatique
- [ ] Planifier les événements automatiques

### Migrations
- [ ] Créer migration `workflow_state` sur `projets`
- [ ] Créer migration progression/avancement sur `projets`
- [ ] Créer table `checklist_dossier`
- [ ] Créer table `jalons`
- [ ] Créer table `livrables`
- [ ] Créer table `echeances`
- [ ] Enrichir table `appels_offres`
- [ ] Enrichir table `evenements`

### Services
- [ ] Créer service `evenement_service.py`
- [ ] Implémenter `creer_evenement()`
- [ ] Implémenter `creer_evenement_changement()`
- [ ] Créer service `migration_service.py`
- [ ] Implémenter `migrer_ao_vers_opportunite()`
- [ ] Implémenter `migrer_opportunite_vers_projet()`

### Endpoints
- [ ] POST `/appels-offres/{id}/interesser` (enrichi)
- [ ] PUT `/projets/{id}/statut` (nouveau)
- [ ] POST `/projets/{id}/convertir-en-projet` (nouveau)
- [ ] GET `/projets/{id}/dashboard` (nouveau)
- [ ] GET `/projets/{id}/progression-dossier` (nouveau)
- [ ] PUT `/projets/{id}/progression-dossier` (nouveau)
- [ ] GET `/projets/{id}/checklist` (nouveau)
- [ ] GET `/projets/{id}/documents-dce` (nouveau)
- [ ] GET `/evenements/{entite_type}/{entite_id}` (nouveau)
- [ ] GET `/evenements/recent` (nouveau)

### Tests
- [ ] Tester migration AO → Opportunité
- [ ] Tester migration Opportunité → Projet
- [ ] Tester création événements automatiques
- [ ] Tester endpoints dashboard
- [ ] Tester changement de statut
- [ ] Tester timeline par entité

### Documentation
- [ ] Documenter les nouveaux endpoints
- [ ] Documenter les nouveaux modèles
- [ ] Documenter les événements automatiques
- [ ] Mettre à jour les schémas OpenAPI
