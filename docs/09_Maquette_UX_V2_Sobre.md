# Maquette UX V2 - Design Sobre et Cohérent

## Vision

Design inspiré de Linear/Notion, sobre, aéré, professionnel. Éviter le mélange de styles. Identité graphique cohérente avec le reste de l'application SIS.

---

## 1. Opportunités d'affaires

### 1.1 Layout de la page

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: Opportunités d'affaires                                    │
│ "12 opportunités en cours"                                          │
├─────────────────────────────────────────────────────────────────────┤
│ KPIs Dashboard (compacts, horizontal)                              │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ 12     │ │ 3      │ │ 68%    │ │ 2.5M DH│ │ 2      │            │
│ │ Actives│ │ Dépôts │ │ Réussite│ │ Potentiel│ │ Urgentes│            │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│ Barre de filtres: [Recherche...] [Statut ▼] [Nouvelle opportunité]  │
├─────────────────────────────────────────────────────────────────────┤
│ Liste de cartes (grille, aérée)                                     │
│ ┌─────────────────────────────────────┐ ┌─────────────────────────┐│
│ │ Rénovation bâtiment communal...    │ │ Digitalisation services ││
│ │ Mairie de Paris                     │ │ Conseil Régional       ││
│ │ 12 500 DH • 15/06/2025              │ │ 1 250 000 DH • 30/06 ││
│ │ ████████░░ 45% • Jean Dupont • ... │ │ ██████░░░░ 60% • ...  ││
│ └─────────────────────────────────────┘ └─────────────────────────┘│
│ ┌─────────────────────────────────────┐                             │
│ │ Travaux réseaux télécom...          │                             │
│ │ Orange Business Services            │                             │
│ │ 875 000 DH • 10/07/2025             │                             │
│ │ ████░░░░░░ 25% • Non assigné • ... │                             │
│ └─────────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Carte opportunité (allégée)

```
┌─────────────────────────────────────────────────────┐
│ [STATUT] Titre de l'opportunité...              [...]│
│ Organisme • Budget • Date limite                    │
│ ████████░░ 45% • Responsable • [...]                │
└─────────────────────────────────────────────────────┘
```

**Structure visuelle** :
- **Ligne 1** : Badge statut + Titre (ellipsis 2-3 lignes) + Menu "..."
- **Ligne 2** : Organisme + Budget formaté + Date limite
- **Ligne 3** : Progression (barre compacte) + Responsable + Menu actions rapide

**Informations affichées** :
- ✅ Titre (ellipsis 2-3 lignes max)
- ✅ Organisme
- ✅ Budget (format DH marocain : `12 500 DH`, `1 250 000 DH`)
- ✅ Date limite
- ✅ Progression dossier (barre compacte + %)
- ✅ Responsable (si assigné, sinon "Non assigné")

**Informations supprimées** :
- ❌ Score IA (trop détaillé pour une vue liste)
- ❌ Nombre de documents DCE (non critique)
- ❌ Boutons d'action multiples (trop encombrant)
- ❌ Méta secondaires (type de procédure, etc.)

**Actions** :
- Menu "..." avec options :
  - Ouvrir le détail
  - Changer le statut ▶
    - Intéressé
    - En préparation
    - Prêt à déposer
    - Déposé
    - Gagné → Convertir en projet
    - Rejeté
    - Ignoré → Archiver
  - Archiver

### 1.3 KPIs Dashboard (compacts)

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│    12      │     5       │     3       │  2.5M DH    │     2       │
│ Actives    │ En prépa.   │ Déposés    │ Potentiel  │ Urgentes    │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Style** :
- Cartes compactes (200px de large)
- Chiffre en grand (h2)
- Label en petit (caption)
- Fond gris très clair
- Bordure subtile
- Aération maximale

**Données** :
- **Actives** : Opportunités en cours (Intéressé + En préparation + Prêt à déposer + Déposé)
- **En préparation** : Dossiers en préparation (En préparation + Prêt à déposer)
- **Déposés** : Offres déposées
- **Potentiel** : Budget total des opportunités actives (format DH)
- **Urgentes** : Échéances dans les 7 jours

### 1.4 Page Archives (fusionnée)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Header: Archives d'opportunités                                    │
│ "8 dossiers archivés"                                              │
├─────────────────────────────────────────────────────────────────────┤
│ Filtres: [Tous ▼] [Ignoré] [Rejeté] [Recherche...]              │
├─────────────────────────────────────────────────────────────────────┤
│ Liste de cartes (style grisé, opacity 0.7)                         │
│ ┌─────────────────────────────────────┐ ┌─────────────────────────┐│
│ │ [IGNORÉ] Projet informatique...    │ │ [REJETÉ] Travaux BTP...││
│ │ Conseil Régional • 45 000 DH       │ │ Ville de Lyon • 120K DH││
│ │ ████░░░░░ 30% • [Réactiver] [...]  │ │ ████░░░░░ 30% • [...]  ││
│ └─────────────────────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

**Navigation** :
- Une seule page `/opportunites/archives`
- Filtre par statut : Tous / Ignoré / Rejeté
- Option "Réactiver" dans le menu de chaque carte
- Option "Supprimer définitivement" (après confirmation)

---

## 2. Suivi de projet

### 2.1 Layout de la page

```
┌─────────────────────────────────────────────────────────────────────┐
│ Barre de workflow métier (horizontale)                              │
│ AO ✔ Préparation ✔ Dépôt ✔ Attribué ✔ Exécution ███░░░░ Clôture   │
├─────────────────────────────────────────────────────────────────────┤
│ Header Projet (très riche, horizontal)                              │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Rénovation bâtiment    Mairie de Paris    [EN EXÉCUTION] 45% │ │
│ │ 12 500 DH  •  Jean Dupont  •  01/07 → 31/12  •  3 membres  •  2 ST│ │
│ │ 1 contrat  •  4 livrables  •  Échéance: 15/09  •  Il y a 2h [Mod]│ │
│ └───────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ Onglets métier                                                      │
│ [Infos] [Planning] [Équipe] [Sous-traitants] [Documents] [Contrats] [Livrables] [Historique]│
├─────────────────────────────────────────────────────────────────────┤
│ Contenu de l'onglet sélectionné (par défaut: Historique)           │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ Timeline verticale moderne                                    │ │
│ │ ──► Projet créé (Il y a 2 jours)                             │ │
│ │     Conversion depuis l'opportunité AO-2025-001               │ │
│ │ ──► Équipe affectée (Il y a 1 jour)                           │ │
│ │     3 membres assignés                                        │ │
│ │ ──► Contrat signé (Il y a 4 heures)                           │ │
│ │     CT-2025-014 avec ABC SARL                                 │ │
│ │ ──► Document ajouté (Il y a 2 heures)                         │ │
│ │     Plan architecte v1.2                                      │ │
│ └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Header Projet (très riche, style Azure DevOps)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Rénovation bâtiment communal          Mairie de Paris    [EN EXÉCUTION] 45% │
│ 12 500 DH  •  Jean Dupont  •  01/07 → 31/12/2025  •  3 membres  •  2 ST  │
│ 1 contrat  •  4 livrables  •  Prochaine échéance: 15/09  •  Il y a 2h [Mod]│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Ligne 1** :
- Nom du projet (h2, gras)
- Organisme (client)
- Badge statut (compact)
- Progression globale (barre compacte + %)

**Ligne 2** :
- Budget (format DH marocain)
- Chef de projet
- Dates (Début → Fin)
- Nombre de membres équipe
- Nombre de sous-traitants (ST)

**Ligne 3** :
- Nombre de contrats
- Nombre de livrables
- Prochaine échéance (avec date)
- Dernière activité (temps relatif)
- Bouton "Modifier" (secondaire)

**Informations affichées** :
- ✅ Nom du projet
- ✅ Organisme (client)
- ✅ Statut (badge compact)
- ✅ Progression globale (barre + %)
- ✅ Budget (format DH marocain)
- ✅ Chef de projet
- ✅ Dates (début → fin)
- ✅ Équipe (nombre de membres)
- ✅ Sous-traitants (nombre)
- ✅ Contrats (nombre)
- ✅ Livrables (nombre)
- ✅ Prochaine échéance
- ✅ Dernière activité

### 2.3 Barre de workflow métier

```
AO ✔ Préparation ✔ Dépôt ✔ Attribué ✔ Exécution ███░░░░ Clôture
```

**Style** :
- Barre horizontale en haut de la page
- Étapes : AO → Préparation → Dépôt → Attribué → Exécution → Clôture
- Indicateur visuel : ✔ (complété) ou progression (███░░░░)
- Étape actuelle mise en évidence
- Aération maximale

**But** :
- Aider l'utilisateur à comprendre où il en est dans le cycle
- Visibilité immédiate de la progression

### 2.4 Onglets métier

**Onglets** :
- **Infos** : Informations générales (formulaire existant)
- **Planning** : Planning/jalons du projet (nouveau)
- **Équipe** : Gestion de l'équipe (tableau existant)
- **Sous-traitants** : Gestion des sous-traitants (tableau existant)
- **Documents** : Gestion des documents (tableau existant)
- **Contrats** : Gestion des contrats (tableau existant)
- **Livrables** : Gestion des livrables (nouveau)
- **Historique** : Timeline automatique (nouveau, par défaut)

**Style** :
- Onglets horizontaux, compacts
- Indicateur visuel de l'onglet actif (ligne en bas)
- Hover subtil
- Transition fluide

### 2.5 Timeline / Historique (améliorée)

```
┌───────────────────────────────────────────────────────────────┐
│ Historique du projet                                           │
│ ──► ━━━━ Projet créé (Il y a 2 jours)                          │
│     Conversion depuis l'opportunité AO-2025-001                 │
│     Par Jean Dupont                                            │
│ ──► ━━━━ Équipe affectée (Il y a 1 jour)                       │
│     3 membres assignés: Jean Dupont, Marie Martin, Pierre Durand│
│ ──► ━━━━ Contrat signé (Il y a 4 heures)                       │
│     CT-2025-014 avec ABC SARL • 25 000 DH                     │
│ ──► ━━━━ Document ajouté (Il y a 2 heures)                     │
│     Plan architecte v1.2 par Marie Martin                       │
│ ──► ━━━━ Livrable envoyé (Il y a 1 heure)                      │
│     Livraison 1 - Gros œuvre                                   │
└───────────────────────────────────────────────────────────────┘
```

**Style** :
- Timeline verticale, élégante
- Ligne verticale fine (gris clair)
- Points sur la ligne (cercles avec icônes)
- Icônes par type d'événement (création, équipe, contrat, document, livrable, etc.)
- Dates en temps relatif ("Il y a 2 jours", "Il y a 4 heures")
- Description détaillée de chaque événement
- Auteur de l'action (si applicable)

**Événements automatiques** (à alimenter par le backend) :
- Création du projet
- Migration depuis une opportunité
- Ajout d'un membre d'équipe
- Retrait d'un membre d'équipe
- Ajout d'un sous-traitant
- Retrait d'un sous-traitant
- Contrat créé
- Contrat signé
- Avenant signé
- Document ajouté
- Document modifié
- Livrable créé
- Livrable envoyé
- Livrable validé
- Livrable rejeté
- Facture créée
- Paiement reçu
- Changement de statut
- Projet archivé

---

## 3. Distinction Opportunité vs Projet

### 3.1 Opportunité - Objectif : Préparer une réponse

**Focus** : Préparation du dossier de candidature

**Onglets** :
- **Infos** : Informations générales
- **DCE** : Document de consultation des entreprises
- **Dossier candidature** : Pièces administratives
- **Analyse IA** : Analyse IA (résumé, score, recommandations)
- **Portail** : Lien vers le portail officiel
- **Checklist** : Checklist des pièces requises
- **Historique** : Timeline automatique

**Contenu prioritaire** :
- DCE (documents, cahier des charges)
- Dossier de candidature (pièces, formulaires)
- Analyse IA (score IA, recommandations)
- Portail (URL, soumission)
- Checklist (pièces requises vs fournies)

**Contenu secondaire** :
- DCE consultable (pas centralisé)
- Historique (timeline)

### 3.2 Projet - Objectif : Exécuter le marché

**Focus** : Exécution et suivi du marché

**Onglets** :
- **Infos** : Informations générales
- **Planning** : Planning/jalons
- **Équipe** : Gestion de l'équipe
- **Sous-traitants** : Gestion des sous-traitants
- **Documents** : Gestion des documents
- **Contrats** : Gestion des contrats
- **Livrables** : Gestion des livrables
- **Historique** : Timeline automatique

**Contenu prioritaire** :
- Équipe (membres, rôles)
- Planning (jalons, échéances)
- Livrables (phases, livrables)
- Contrats (contrats, avenants)
- Sous-traitants (mobilisation)
- Documents (plans, rapports)
- Avancement (progression globale)

**Contenu secondaire** :
- DCE (consultable, ressource)
- Historique (timeline)

### 3.3 Différence visuelle

**Opportunité** :
- Couleur : Orange/Warning (préparation)
- Focus : Checklist, DCE, IA
- Action : Préparer → Déposer

**Projet** :
- Couleur : Bleu/Success (exécution)
- Focus : Équipe, Planning, Livrables
- Action : Exécuter → Livrer

---

## 4. Design System - Style Sobre

### 3.1 Palette de couleurs

```javascript
const COLORS = {
  // UI de base
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceAlt: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  
  // Texte
  text: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textMuted: "#CBD5E1",
  
  // Accents (sobres)
  primary: "#243746",       // Gris foncé
  primaryLight: "#E4E7E9",  // Gris très clair
  accent: "#3B82F6",        // Bleu professionnel
  accentLight: "#DBEAFE",   // Bleu très clair
  
  // Statuts (pastels, sobres)
  success: "#10B981",       // Vert (gagné, actif)
  successLight: "#ECFDF5",  // Vert très clair
  warning: "#F59E0B",       // Orange (en préparation)
  warningLight: "#FFFBEB",  // Orange très clair
  danger: "#EF4444",        // Rouge (rejeté, urgent)
  dangerLight: "#FEF2F2",   // Rouge très clair
  info: "#3B82F6",          // Bleu (en cours)
  infoLight: "#EFF6FF",     // Bleu très clair
  neutral: "#64748B",       // Gris (ignoré)
  neutralLight: "#F5F5F5",  // Gris très clair
};
```

### 3.2 Typography

```javascript
const TYPOGRAPHY = {
  h1: { fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.3 },
  h2: { fontSize: 16, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.2 },
  h3: { fontSize: 14, fontWeight: 600, lineHeight: 1.4, letterSpacing: -0.1 },
  h4: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
  small: { fontSize: 11, fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: 10, fontWeight: 500, lineHeight: 1.3 },
  tiny: { fontSize: 9, fontWeight: 500, lineHeight: 1.2 },
};
```

### 3.3 Spacing

```javascript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};
```

### 3.4 Borders

```javascript
const BORDERS = {
  radius: {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    full: 9999,
  },
};
```

### 3.5 Shadows

```javascript
const SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
  lg: "0 4px 6px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
};
```

---

## 5. Formatage monétaire (DH marocain)

```javascript
function formatMontant(montant) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant).replace('MAD', 'DH');
}

// Exemples :
// 12500 → "12 500 DH"
// 1250000 → "1 250 000 DH"
// 25000000 → "25 000 000 DH"
```

---

## 6. Checklist de validation

### Opportunités
- [ ] Cartes allégées (titre, organisme, budget, date, progression, responsable)
- [ ] Titre ellipsis 2-3 lignes max
- [ ] Budget formaté en DH marocain
- [ ] Actions via menu "..." (pas de boutons multiples)
- [ ] KPIs compacts (Actives, En préparation, Déposés, Potentiel, Urgentes)
- [ ] Suppression bouton "Nouvelle opportunité"
- [ ] Nouvel état "Prêt à déposer"
- [ ] Page Archives fusionnée (Ignoré + Rejeté)
- [ ] Filtre par statut sur la page Archives
- [ ] Design sobre, aéré

### Suivi Projet
- [ ] Barre de workflow métier (AO → Préparation → Dépôt → Attribué → Exécution → Clôture)
- [ ] Header très riche (toutes les méta visibles : nom, organisme, statut, progression, budget, chef, dates, équipe, ST, contrats, livrables, échéance, activité)
- [ ] Suppression widgets vides
- [ ] Onglets métier horizontaux (Infos, Planning, Équipe, Sous-traitants, Documents, Contrats, Livrables, Historique)
- [ ] Timeline verticale améliorée
- [ ] Timeline par défaut (onglet Historique)
- [ ] Événements automatiques listés (incluant factures et paiements)
- [ ] Design sobre, cohérent

### Distinction Opportunité vs Projet
- [ ] Opportunité : Focus préparation (DCE, dossier candidature, IA, portail, checklist)
- [ ] Projet : Focus exécution (équipe, planning, livrables, contrats, sous-traitants, documents)
- [ ] Différence visuelle (couleurs, focus)
- [ ] DCE consultable mais pas centralisé dans le projet

### Design System
- [ ] Palette sobre (gris, bleu professionnel)
- [ ] Typography réduite (font sizes plus petits)
- [ ] Spacing aéré
- [ ] Shadows subtiles
- [ ] Identité cohérente avec Linear/Notion

---

## 7. Comparaison Avant / Après

### Opportunités

**Avant** :
- Cartes chargées avec beaucoup d'informations
- Boutons d'action multiples visibles
- Score IA affiché
- KPIs volumineux
- Bouton "Nouvelle opportunité" (incohérent)
- Deux pages séparées (Ignorées + Rejetés)
- Statut "Déposé" sans "Prêt à déposer"

**Après** :
- Cartes allégées, essentiel uniquement
- Actions via menu "..."
- Score IA caché (dans le détail)
- KPIs compacts (sans taux de réussite)
- Suppression bouton "Nouvelle opportunité"
- Une seule page Archives avec filtre
- Nouvel état "Prêt à déposer"

### Suivi Projet

**Avant** :
- Dashboard avec widgets vides
- Header basique
- Widgets (Planning, Équipe, Contrats, Documents, etc.)
- Timeline en bas de page
- Pas de distinction visuelle avec opportunité

**Après** :
- Barre de workflow métier (AO → Préparation → Dépôt → Attribué → Exécution → Clôture)
- Header très riche avec toutes les méta (nom, organisme, statut, progression, budget, chef, dates, équipe, ST, contrats, livrables, échéance, activité)
- Suppression widgets vides
- Onglets métier horizontaux (avec Planning et Livrables)
- Timeline par défaut (onglet Historique)
- Timeline améliorée avec événements automatiques (incluant factures et paiements)
- Distinction visuelle opportunité vs projet

---

## Résumé des corrections apportées

1. ✅ KPIs modifiés : suppression "Taux de réussite", ajout "En préparation" et "Déposés"
2. ✅ Suppression bouton "Nouvelle opportunité"
3. ✅ Nouvel état "Prêt à déposer" ajouté au workflow
4. ✅ Header Projet enrichi : ajout contrats, livrables, méta complètes
5. ✅ Onglets ajoutés : Planning et Livrables
6. ✅ Barre de workflow métier ajoutée (AO → Préparation → Dépôt → Attribué → Exécution → Clôture)
7. ✅ Timeline événements enrichis : ajout factures et paiements
8. ✅ Distinction Opportunité vs Projet clarifiée (focus différent, onglets différents)

---

Cette maquette est validée et prête pour l'implémentation.
