// Configuration des transitions valides par statut actuel
// Correspond exactement au workflow backend (projets.py)

export const TRANSITIONS_PAR_STATUT = {
  interesse: [
    { value: "en_preparation", label: "En préparation" },
    { value: "ignore", label: "Ignorer" },
    { value: "abandonne", label: "Abandonner" },
  ],
  en_preparation: [
    { value: "pret_a_deposer", label: "Prêt à déposer" },
    { value: "soumis", label: "Déposée" },
    { value: "ignore", label: "Ignorer" },
    { value: "abandonne", label: "Abandonner" },
  ],
  pret_a_deposer: [
    { value: "soumis", label: "Déposée" },
    { value: "en_preparation", label: "Retour en préparation" },
    { value: "ignore", label: "Ignorer" },
    { value: "abandonne", label: "Abandonner" },
  ],
  soumis: [
    { value: "gagne", label: "Gagnée → Convertir en projet" },
    { value: "perdu", label: "Perdue" },
    { value: "en_preparation", label: "Retour en préparation" },
  ],
  a_demarrer: [
    { value: "en_execution", label: "Démarrer l'exécution" },
    { value: "suspendu", label: "Suspendre" },
  ],
  en_execution: [
    { value: "termine", label: "Terminer" },
    { value: "suspendu", label: "Suspendre" },
  ],
  perdu: [],
  ignore: [
    { value: "interesse", label: "Réactiver" },
  ],
  abandonne: [
    { value: "interesse", label: "Réactiver" },
  ],
  suspendu: [
    { value: "en_execution", label: "Reprendre" },
    { value: "termine", label: "Terminer" },
  ],
  termine: [], // Les projets terminés n'ont plus de transitions valides
};

// Pour compatibilité avec l'ancien code
export const STATUT_OPTIONS_BY_WORKFLOW_STATE = {
  opportunite: [
    { value: "interesse", label: "Intéressé" },
    { value: "en_preparation", label: "En préparation" },
    { value: "pret_a_deposer", label: "Prêt à déposer" },
    { value: "soumis", label: "Déposée" },
    { value: "gagne", label: "Gagnée → Convertir en projet" },
    { value: "perdu", label: "Rejetée" },
    { value: "abandonne", label: "Abandonnée" },
  ],
  projet: [
    { value: "a_demarrer", label: "À démarrer" },
    { value: "en_execution", label: "En exécution" },
    { value: "suspendu", label: "Suspendu" },
    { value: "termine", label: "Terminé" },
  ],
};
