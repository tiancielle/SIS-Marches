// Mapping statut -> phase du cycle de vie métier.
// HYPOTHÈSE À CONFIRMER PAR LE BACKEND : basée sur les statuts déjà présents dans
// Badge.jsx ("NOUVEAUX STATUTS PROJET / MARCHÉ") mais jamais reliés à une logique
// de phase avant cette étape. Si le backend confirme une liste différente, seul ce
// fichier a besoin de changer — toutes les vues s'appuient dessus, aucune duplication.

export const OPPORTUNITE_STATUTS = ["interesse", "en_preparation", "soumis", "perdu", "abandonne"];
export const PROJET_STATUTS = ["gagne", "en_execution", "actif", "termine"];

export function getPhase(statut) {
  return PROJET_STATUTS.includes(statut) ? "projet" : "opportunite";
}

export function isOpportunite(projet) {
  return getPhase(projet.statut) === "opportunite";
}

export function isProjetGagne(projet) {
  return getPhase(projet.statut) === "projet";
}