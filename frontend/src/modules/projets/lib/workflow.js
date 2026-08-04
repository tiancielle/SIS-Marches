// Logique workflow - remplace phase.js
// HYPOTHÈSE : basée sur les statuts existants, enrichie avec workflow_state

export const WORKFLOW_STATES = ["opportunite", "projet"];

export const OPPORTUNITE_STATUTS = ["interesse", "en_preparation", "soumis", "perdu", "abandonne", "gagne"];
export const PROJET_STATUTS = ["en_execution", "actif", "suspendu", "termine"];

export function getWorkflowState(statut) {
  if (PROJET_STATUTS.includes(statut)) return "projet";
  return "opportunite";
}

export function isOpportunite(projet) {
  return getWorkflowState(projet.statut) === "opportunite";
}

export function isProjet(projet) {
  return getWorkflowState(projet.statut) === "projet";
}

export function isProjetGagne(projet) {
  return projet.statut === "gagne";
}

export function canConvertToProjet(projet) {
  return projet.statut === "gagne" && projet.workflow_state === "opportunite";
}

// Workflow simplifié inspiré de Linear/Notion
// Note: workflow_state est maintenant géré automatiquement par le backend
// Cette fonction ne retourne que le statut à envoyer
export function getNextWorkflowState(statut, action) {
  // Le backend mettra à jour workflow_state automatiquement selon le statut
  return { statut: action };
}

export function shouldArchiveExpired(opportunite) {
  const dateLimite = new Date(opportunite.date_limite_ao || opportunite.fin);
  const now = new Date();
  const daysSince = Math.floor((now - dateLimite) / (1000 * 60 * 60 * 24));
  return daysSince > 0 && opportunite.statut !== "soumis" && opportunite.statut !== "gagne";
}
