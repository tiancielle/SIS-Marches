# SIS Suivi Marchés — Frontend

Application interne de SIS Consultants pour la veille des marchés publics marocains,
le suivi des projets, contrats, ressources (équipe & sous-traitants), et — à venir —
la facturation et les paiements.

## Stack

- **React 19** + **React Router 7**
- **Vite 8** (build & dev server), lint via **Oxlint**
- **Recharts** pour les visualisations, **lucide-react** pour les icônes
- Pas de framework CSS — design system maison (`src/styles/theme.js`), composants stylés en inline

## Démarrage

```bash
npm install
cp .env.example .env.local   # ajuster VITE_API_BASE_URL si besoin
npm run dev
```

L'app suppose une API backend FastAPI disponible (voir `VITE_API_BASE_URL`,
`http://localhost:8000` par défaut). Le module Marchés Publics fonctionne actuellement sur
des données simulées côté frontend (`src/lib/mockData.js`) en attendant l'endpoint d'analyse IA.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Lint via Oxlint |

## Structure

```
src/
├── components/       # Composants partagés (ui/ = design system, layout/ = Sidebar, Header...)
├── modules/          # Un dossier par domaine métier (accueil, veille, projets, ressources,
│                        finances, administration), chacun avec pages/ et éventuellement components/
├── store/            # DataContext — state global de l'app (useData())
├── services/         # Appels API vers le backend FastAPI
├── styles/           # theme.js (tokens de design) + global.css (reset minimal)
└── lib/               # Helpers partagés (formatage, données simulées de la veille)
```

Chaque module suit la même convention : `modules/{nom}/pages/{Page}.jsx` pour les écrans,
`modules/{nom}/components/` pour les sous-composants propres à ce module. Les composants
génériques réutilisables dans plusieurs modules vivent dans `components/ui/`.

## Design system

Toutes les couleurs, rayons de bordure et polices passent par `src/styles/theme.js` (objet `C`,
`FONT`, `FONT_DISPLAY`) — pas de couleurs codées en dur dans les composants. Deux polices :
Fraunces (titres) et Inter (le reste), chargées via Google Fonts dans `index.html`.