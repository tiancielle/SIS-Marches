# Proposition UX Moderne - Opportunités & Suivi Projet

## Vision générale

Créer une interface professionnelle inspirée de Notion/Linear/Jira/Monday, adaptée au métier des appels d'offres et marchés publics.

## 1. Opportunités d'affaires - Refonte complète

### 1.1 Architecture de la page

```
┌─────────────────────────────────────────────────────────────────┐
│ KPIs Dashboard (horizontal)                                      │
├─────────────────────────────────────────────────────────────────┤
│ Opportunités actives | Dépôts réalisés | Taux réussite | Budget │
├─────────────────────────────────────────────────────────────────┤
│ Barre de filtres et recherche                                    │
├─────────────────────────────────────────────────────────────────┤
│ Layout hybride : Liste principale + Preview latéral             │
├─────────────────────────────────────────────────────────────────┤
│                     │ Selected Item Preview                      │
│  Liste avec     │  ┌─────────────────────────────────────┐      │
│  cartes riches  │  │ Header Opportunité                 │      │
│                 │  ├─────────────────────────────────────┤      │
│  - Statut       │  │ Informations détaillées             │      │
│  - Titre        │  │ - Organisme                        │      │
│  - Budget       │  │ - Budget                           │      │
│  - Date limite  │  │ - Date limite                      │      │
│  - Score IA     │  │ - Score IA                         │      │
│  - Progression  │  │ - État préparation                 │      │
│  - Actions      │  │ - Responsable                      │      │
│                 │  ├─────────────────────────────────────┤      │
│  Actions rapides│  │ Actions rapides                    │      │
│  sur chaque     │  │ - Ouvrir détail                    │      │
│  carte          │  │ - Ignorer                          │      │
│                 │  │ - Marquer gagnée                   │      │
│                 │  │ - Marquer rejetée                  │      │
│                 │  │ - Déposer offre                    │      │
│                 │  └─────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Composant carte enrichi

```jsx
// components/OpportuniteCard.jsx
<OpportuniteCard>
  <CardHeader>
    <StatutBadge />
    <ProgressBar value={preparationProgress} />
    <DropdownActions />
  </CardHeader>
  
  <CardBody>
    <Title>Titre de l'opportunité</Title>
    <Organisme>Organisme</Organisme>
    <Budget>€XXX XXX</Budget>
    <DateLimite>JJ/MM/AAAA</DateLimite>
    <ScoreIA>Score: XX/100</ScoreIA>
    <DocumentsCount>XX documents DCE</DocumentsCount>
    <Responsable>Responsable</Responsable>
  </CardBody>
  
  <CardFooter>
    <QuickActions>
      <ActionButton icon="eye" label="Ouvrir" />
      <ActionButton icon="trash" label="Ignorer" />
      <ActionButton icon="check" label="Gagnée" />
      <ActionButton icon="x" label="Rejetée" />
    </QuickActions>
  </CardFooter>
</OpportuniteCard>
```

### 1.3 Nouveaux états

**États principaux (workflow)** :
- Intéressé
- En préparation
- Déposé
- Gagné
- Rejeté
- Abandonné

**Nouvel état : Ignoré**
- Les opportunités ignorées migrent automatiquement vers `/opportunites/ignorees`
- Vue séparée avec possibilité de réactiver

### 1.4 KPIs Dashboard

```jsx
// components/OpportuniteKPIs.jsx
<OpportuniteKPIs>
  <KPICard 
    label="Opportunités actives" 
    value={count} 
    trend="+2 cette semaine"
    icon="briefcase"
  />
  <KPICard 
    label="Dépôts réalisés" 
    value={depots} 
    trend="3 en attente"
    icon="send"
  />
  <KPICard 
    label="Taux de réussite" 
    value="68%" 
    trend="+5% vs mois dernier"
    icon="trending-up"
  />
  <KPICard 
    label="Budget potentiel" 
    value="€1.2M" 
    trend="€800K signés"
    icon="euro"
  />
  <KPICard 
    label="Échéances cette semaine" 
    value={urgent} 
    trend="2 urgentes"
    icon="alert"
  />
</OpportuniteKPIs>
```

### 1.5 Actions rapides

```jsx
// Chaque carte a des actions inline
<QuickActions>
  <IconButton 
    icon="Eye" 
    tooltip="Ouvrir le détail"
    onClick={() => navigate(`/opportunites/${id}`)}
  />
  <IconButton 
    icon="X" 
    tooltip="Ignorer cette opportunité"
    onClick={() => handleIgnore(id)}
  />
  <IconButton 
    icon="Check" 
    tooltip="Marquer comme gagnée"
    onClick={() => handleMarkGagne(id)}
  />
  <IconButton 
    icon="Send" 
    tooltip="Déposer l'offre"
    onClick={() => handleDeposer(id)}
  />
</QuickActions>
```

## 2. Suivi de projet - Dashboard pilotage

### 2.1 Architecture de la page

```
┌─────────────────────────────────────────────────────────────────┐
│ Header Projet enrichi                                            │
├─────────────────────────────────────────────────────────────────┤
│ Nom | Statut | Budget | Avancement | Chef | Dates | Équipe | Docs│
├─────────────────────────────────────────────────────────────────┤
│ Dashboard Widgets (grid layout)                                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Planning    │ │ Équipe      │ │ Sous-trait. │ │ Contrats    ││
│ │ Widget      │ │ Widget      │ │ Widget      │ │ Widget      ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Documents   │ │ Historique  │ │ Échéances   │ │ KPIs        ││
│ │ Widget      │ │ Widget      │ │ Widget      │ │ Widget      ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ Timeline verticale (derniers événements)                          │
├─────────────────────────────────────────────────────────────────┤
│ Onglets détaillés (pour approfondir)                             │
│ Infos | Équipe | Sous-traitants | Documents | Contrats | Hist. │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Header Projet enrichi

```jsx
// components/ProjetHeader.jsx
<ProjetHeader>
  <TitleSection>
    <ProjectName>Projet XYZ</ProjectName>
    <StatutBadge>En exécution</StatutBadge>
    <ProgressBar value={avancement} label="Avancement global" />
  </TitleSection>
  
  <MetaSection>
    <MetaItem icon="euro" label="Budget" value="€XXX XXX" />
    <MetaItem icon="user" label="Chef" value="Nom" />
    <MetaItem icon="calendar" label="Début" value="JJ/MM/AAAA" />
    <MetaItem icon="calendar" label="Fin" value="JJ/MM/AAAA" />
    <MetaItem icon="users" label="Équipe" value="X membres" />
    <MetaItem icon="file" label="Documents" value="XX docs" />
    <MetaItem icon="clock" label="Dernière activité" value="Il y a 2h" />
  </MetaSection>
  
  <ActionsSection>
    <Button primary>Modifier</Button>
    <Button secondary>Ajouter livrable</Button>
    <Button danger>Archiver</Button>
  </ActionsSection>
</ProjetHeader>
```

### 2.3 Widgets Dashboard

#### Planning Widget
```jsx
<PlanningWidget>
  <WidgetHeader>
    <Title>Planning</Title>
    <Link>Voir tout →</Link>
  </WidgetHeader>
  <TimelineMini>
    <Milestone date="15/06" status="completed">Démarrage</Milestone>
    <Milestone date="30/06" status="in-progress">Livraison 1</Milestone>
    <Milestone date="15/07" status="pending">Livraison 2</Milestone>
    <Milestone date="31/08" status="pending">Fin projet</Milestone>
  </TimelineMini>
</PlanningWidget>
```

#### Équipe Widget
```jsx
<EquipeWidget>
  <WidgetHeader>
    <Title>Équipe ({members.length})</Title>
    <Link>Gérer →</Link>
  </WidgetHeader>
  <MemberList>
    {members.map(member => (
      <MemberItem>
        <Avatar>{initials}</Avatar>
        <Info>
          <Name>{member.nom}</Name>
          <Role>{member.role}</Role>
        </Info>
        <StatusBadge>Active</StatusBadge>
      </MemberItem>
    ))}
  </MemberList>
</EquipeWidget>
```

#### Contrats Widget
```jsx
<ContratsWidget>
  <WidgetHeader>
    <Title>Contrats ({contrats.length})</Title>
    <Link>Voir tout →</Link>
  </WidgetHeader>
  <ContratList>
    {contrats.map(contrat => (
      <ContratItem>
        <Reference>{contrat.reference}</Reference>
        <Montant>{fmt(contrat.montant)}</Montant>
        <StatutBadge>{contrat.statut}</StatutBadge>
        <Link>Détail →</Link>
      </ContratItem>
    ))}
  </ContratList>
</ContratsWidget>
```

#### Documents Widget
```jsx
<DocumentsWidget>
  <WidgetHeader>
    <Title>Documents ({docs.length})</Title>
    <Link>Voir tout →</Link>
  </WidgetHeader>
  <DocumentList>
    {docs.map(doc => (
      <DocumentItem>
        <FileIcon type={doc.type} />
        <Name>{doc.nom}</Name>
        <Date>{fmtDate(doc.date)}</Date>
        <Action>Download</Action>
      </DocumentItem>
    ))}
  </DocumentList>
</DocumentsWidget>
```

### 2.4 Timeline verticale moderne

```jsx
// components/ProjectTimeline.jsx
<ProjectTimeline>
  <TimelineHeader>
    <Title>Historique récent</Title>
    <Link>Voir tout →</Link>
  </TimelineHeader>
  
  <Timeline>
    <TimelineEvent>
      <EventIcon type="creation" />
      <EventContent>
        <EventTitle>Projet créé</EventTitle>
        <EventDate>Il y a 2 jours</EventDate>
        <EventAuthor>Par Jean Dupont</EventAuthor>
      </EventContent>
    </TimelineEvent>
    
    <TimelineEvent>
      <EventIcon type="equipe" />
      <EventContent>
        <EventTitle>Équipe affectée</EventTitle>
        <EventDetails>3 membres assignés</EventDetails>
        <EventDate>Il y a 1 jour</EventDate>
      </EventContent>
    </TimelineEvent>
    
    <TimelineEvent>
      <EventIcon type="contrat" />
      <EventContent>
        <EventTitle>Contrat signé</EventTitle>
        <EventDetails>CT-2025-014 avec ABC SARL</EventDetails>
        <EventDate>Il y a 4 heures</EventDate>
      </EventContent>
    </TimelineEvent>
  </Timeline>
</ProjectTimeline>
```

## 3. Navigation métier visible

### 3.1 Breadcrumb contextuel

```jsx
// components/WorkflowBreadcrumb.jsx
<WorkflowBreadcrumb>
  <BreadcrumbItem>Marchés publics</BreadcrumbItem>
  <BreadcrumbSeparator>→</BreadcrumbSeparator>
  <BreadcrumbItem>Analyse IA</BreadcrumbItem>
  <BreadcrumbSeparator>→</BreadcrumbSeparator>
  <BreadcrumbItem active>Opportunité d'affaires</BreadcrumbItem>
  <WorkflowIndicator current="preparation" steps={[
    { id: "veille", label: "Veille", status: "completed" },
    { id: "analyse", label: "Analyse IA", status: "completed" },
    { id: "interet", label: "Intérêt", status: "completed" },
    { id: "preparation", label: "Préparation", status: "current" },
    { id: "depot", label: "Dépôt", status: "pending" },
    { id: "decision", label: "Décision", status: "pending" },
  ]} />
</WorkflowBreadcrumb>
```

### 3.2 Indicateur de progression workflow

```jsx
// components/WorkflowProgress.jsx
<WorkflowProgress>
  <Step status="completed" icon="search">Veille</Step>
  <Connector />
  <Step status="completed" icon="brain">Analyse IA</Step>
  <Connector />
  <Step status="completed" icon="heart">Intérêt</Step>
  <Connector />
  <Step status="current" icon="file-text">Préparation</Step>
  <Connector />
  <Step status="pending" icon="send">Dépôt</Step>
  <Connector />
  <Step status="pending" icon="gavel">Décision</Step>
</WorkflowProgress>
```

## 4. Réutilisation des composants existants

### 4.1 Composants UI à réutiliser

- **Badge** → StatutBadge (avec variantes workflow)
- **Modal** → QuickActionModal, DetailModal
- **Table** → Utiliser dans widgets listes
- **StatCard** → KPICard (enrichi)
- **Field** → FormFields réutilisés
- **Button** → ActionButton, PrimaryButton

### 4.2 Nouveaux composants créés

- **OpportuniteCard** (carte enrichie)
- **ProjetHeader** (header projet)
- **Widget** (container générique widgets)
- **Timeline** (timeline verticale)
- **WorkflowProgress** (indicateur workflow)
- **QuickActions** (actions inline)

## 5. Design System

### 5.1 Palette de couleurs (Notion-inspired)

```javascript
const COLORS = {
  // Statuts workflow
  interesse: { bg: "#E3F2FD", text: "#1976D2", border: "#90CAF9" },
  preparation: { bg: "#FFF3E0", text: "#F57C00", border: "#FFB74D" },
  depose: { bg: "#E8F5E9", text: "#388E3C", border: "#81C784" },
  gagne: { bg: "#E8F5E9", text: "#2E7D32", border: "#66BB6A" },
  rejet: { bg: "#FFEBEE", text: "#D32F2F", border: "#EF9A9A" },
  ignore: { bg: "#F5F5F5", text: "#757575", border: "#BDBDBD" },
  
  // KPIs
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  
  // UI
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
  text: "#1E293B",
  textSecondary: "#64748B",
};
```

### 5.2 Typography

```javascript
const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: 18, fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
  small: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: 11, fontWeight: 500, lineHeight: 1.3 },
};
```

### 5.3 Spacing

```javascript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

## 6. Implémentation progressive

### Phase 1 : Opportunités
1. Créer `OpportuniteCard` (carte enrichie)
2. Créer `OpportuniteKPIs` (dashboard KPIs)
3. Refaire `OpportunitesView` (layout hybride)
4. Ajouter actions rapides inline
5. Créer vue `OpportunitesIgnorees`

### Phase 2 : Suivi Projet
1. Créer `ProjetHeader` (header enrichi)
2. Créer widgets (Planning, Équipe, Contrats, Documents)
3. Créer `ProjectTimeline` (timeline moderne)
4. Refaire `SuiviProjetView` (dashboard)
5. Moderniser les onglets existants

### Phase 3 : Navigation
1. Créer `WorkflowBreadcrumb`
2. Créer `WorkflowProgress`
3. Intégrer dans les pages

## 7. Checklist de validation

### Opportunités
- [ ] Cartes affichent toutes les infos clés
- [ ] Actions rapides fonctionnelles
- [ ] KPIs visibles et pertinents
- [ ] Layout responsive (pas de scroll horizontal)
- [ ] État "Ignoré" fonctionnel
- [ ] Vue "Opportunités ignorées" accessible

### Suivi Projet
- [ ] Header enrichi avec toutes les méta
- [ ] Widgets dashboard informatifs
- [ ] Timeline verticale moderne
- [ ] Navigation fluide entre widgets et onglets
- [ ] Design professionnel type ERP

### Navigation
- [ ] Workflow visible
- [ ] Breadcrumb contextuel
- [ ] Progression workflow claire
- [ ] Actions métier évidentes

## 8. Composants à créer

```javascript
// Nouveaux composants
src/modules/projets/components/
├── OpportuniteCard.jsx
├── OpportuniteKPIs.jsx
├── ProjetHeader.jsx
├── ProjetDashboard.jsx
├── widgets/
│   ├── PlanningWidget.jsx
│   ├── EquipeWidget.jsx
│   ├── ContratsWidget.jsx
│   ├── DocumentsWidget.jsx
│   ├── EcheancesWidget.jsx
│   └── KPIsWidget.jsx
├── timeline/
│   ├── ProjectTimeline.jsx
│   └── TimelineEvent.jsx
├── workflow/
│   ├── WorkflowBreadcrumb.jsx
│   └── WorkflowProgress.jsx
└── quickactions/
    ├── QuickActions.jsx
    └── ActionButton.jsx
```

Cette architecture permet une évolution progressive sans casser l'existant, en réutilisant au maximum les composants UI actuels.
