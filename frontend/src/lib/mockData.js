export const SEED_PROJETS = [
  { id: 1, nom: "Résidence Yasmine", client: "Groupe Amal Immobilier", lieu: "Rabat — Hay Riad", budget: 4200000, statut: "actif", chef: "I. Bennani" },
  { id: 2, nom: "Centre d'affaires Atlas", client: "Atlas Invest", lieu: "Casablanca — Sidi Maarouf", budget: 1500000, statut: "actif", chef: "N. Fassi" },
  { id: 3, nom: "Villa Souissi", client: "Particulier", lieu: "Rabat — Souissi", budget: 350000, statut: "termine", chef: "I. Bennani" },
];

export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " DH";