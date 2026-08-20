// Architecture d'historique automatique des événements métier
// Chaque action métier doit créer un événement via la fonction logEvent()

// Types d'événements métier
export const EVENT_TYPES = {
  // Opportunité / Candidature
  OPPORTUNITY_CREATED: "opportunity_created",
  OPPORTUNITY_INTERESTED: "opportunity_interested",
  OPPORTUNITY_IN_PREPARATION: "opportunity_in_preparation",
  OPPORTUNITY_READY_TO_SUBMIT: "opportunity_ready_to_submit",
  OPPORTUNITY_SUBMITTED: "opportunity_submitted",
  OPPORTUNITY_WON: "opportunity_won",
  OPPORTUNITY_LOST: "opportunity_lost",
  OPPORTUNITY_IGNORED: "opportunity_ignored",
  OPPORTUNITY_ABANDONED: "opportunity_abandoned",
  
  // DCE
  DCE_DOWNLOADED: "dce_downloaded",
  DCE_ANALYSIS_COMPLETED: "dce_analysis_completed",
  
  // Documents candidature
  CANDIDATURE_DOCUMENT_ADDED: "candidature_document_added",
  
  // Projets
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_STATUS_CHANGED: "project_status_changed",
  PROJECT_DELETED: "project_deleted",
  
  // Contrats
  CONTRACT_CREATED: "contract_created",
  CONTRACT_UPDATED: "contract_updated",
  CONTRACT_DELETED: "contract_deleted",
  
  // Documents projet
  DOCUMENT_ADDED: "document_added",
  DOCUMENT_DOWNLOADED: "document_downloaded",
  
  // Équipe
  TEAM_MEMBER_ASSIGNED: "team_member_assigned",
  TEAM_MEMBER_REMOVED: "team_member_removed",
  TEAM_MEMBER_UPDATED: "team_member_updated",
  
  // Sous-traitants
  SUBCONTRACTOR_ASSIGNED: "subcontractor_assigned",
  SUBCONTRACTOR_REMOVED: "subcontractor_removed",
  SUBCONTRACTOR_UPDATED: "subcontractor_updated",
  
  // PPT (future)
  PPT_GENERATED: "ppt_generated",
};

// Phases pour le filtrage
export const EVENT_PHASES = {
  CANDIDATURE: "candidature",
  PROJET: "projet",
};

// Mapping des types d'événements vers les phases
export const EVENT_TYPE_TO_PHASE = {
  [EVENT_TYPES.OPPORTUNITY_CREATED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_INTERESTED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_IN_PREPARATION]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_READY_TO_SUBMIT]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_SUBMITTED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_WON]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_LOST]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_IGNORED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.OPPORTUNITY_ABANDONED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.DCE_DOWNLOADED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.DCE_ANALYSIS_COMPLETED]: EVENT_PHASES.CANDIDATURE,
  [EVENT_TYPES.CANDIDATURE_DOCUMENT_ADDED]: EVENT_PHASES.CANDIDATURE,
  
  [EVENT_TYPES.PROJECT_CREATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.PROJECT_UPDATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.PROJECT_STATUS_CHANGED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.PROJECT_DELETED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.CONTRACT_CREATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.CONTRACT_UPDATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.CONTRACT_DELETED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.DOCUMENT_ADDED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.DOCUMENT_DOWNLOADED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.TEAM_MEMBER_ASSIGNED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.TEAM_MEMBER_REMOVED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.TEAM_MEMBER_UPDATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.SUBCONTRACTOR_ASSIGNED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.SUBCONTRACTOR_REMOVED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.SUBCONTRACTOR_UPDATED]: EVENT_PHASES.PROJET,
  [EVENT_TYPES.PPT_GENERATED]: EVENT_PHASES.PROJET,
};

// Labels par défaut pour chaque type d'événement
const DEFAULT_LABELS = {
  // Opportunité / Candidature
  [EVENT_TYPES.OPPORTUNITY_CREATED]: "Opportunité créée",
  [EVENT_TYPES.OPPORTUNITY_INTERESTED]: "Intérêt marqué",
  [EVENT_TYPES.OPPORTUNITY_IN_PREPARATION]: "Préparation démarrée",
  [EVENT_TYPES.OPPORTUNITY_READY_TO_SUBMIT]: "Prêt à déposer",
  [EVENT_TYPES.OPPORTUNITY_SUBMITTED]: "Candidature déposée",
  [EVENT_TYPES.OPPORTUNITY_WON]: "Marché gagné",
  [EVENT_TYPES.OPPORTUNITY_LOST]: "Marché perdu",
  [EVENT_TYPES.OPPORTUNITY_IGNORED]: "Opportunité ignorée",
  [EVENT_TYPES.OPPORTUNITY_ABANDONED]: "Opportunité abandonnée",
  
  // DCE
  [EVENT_TYPES.DCE_DOWNLOADED]: "DCE téléchargé",
  [EVENT_TYPES.DCE_ANALYSIS_COMPLETED]: "Analyse IA terminée",
  
  // Documents candidature
  [EVENT_TYPES.CANDIDATURE_DOCUMENT_ADDED]: "Document candidature ajouté",
  
  // Projets
  [EVENT_TYPES.PROJECT_CREATED]: "Projet créé",
  [EVENT_TYPES.PROJECT_UPDATED]: "Informations modifiées",
  [EVENT_TYPES.PROJECT_STATUS_CHANGED]: "Statut changé",
  [EVENT_TYPES.PROJECT_DELETED]: "Projet supprimé",
  
  // Contrats
  [EVENT_TYPES.CONTRACT_CREATED]: "Contrat ajouté",
  [EVENT_TYPES.CONTRACT_UPDATED]: "Contrat modifié",
  [EVENT_TYPES.CONTRACT_DELETED]: "Contrat supprimé",
  
  // Documents projet
  [EVENT_TYPES.DOCUMENT_ADDED]: "Document ajouté",
  [EVENT_TYPES.DOCUMENT_DOWNLOADED]: "Document téléchargé",
  
  // Équipe
  [EVENT_TYPES.TEAM_MEMBER_ASSIGNED]: "Membre d'équipe affecté",
  [EVENT_TYPES.TEAM_MEMBER_REMOVED]: "Membre d'équipe retiré",
  [EVENT_TYPES.TEAM_MEMBER_UPDATED]: "Membre d'équipe modifié",
  
  // Sous-traitants
  [EVENT_TYPES.SUBCONTRACTOR_ASSIGNED]: "Sous-traitant affecté",
  [EVENT_TYPES.SUBCONTRACTOR_REMOVED]: "Sous-traitant retiré",
  [EVENT_TYPES.SUBCONTRACTOR_UPDATED]: "Sous-traitant modifié",
  
  // PPT
  [EVENT_TYPES.PPT_GENERATED]: "Présentation générée",
};

/**
 * Fonction centralisée pour enregistrer un événement métier
 * @param {Function} pushHistory - La fonction pushHistory du DataContext
 * @param {number} projectId - L'ID du projet concerné
 * @param {string} eventType - Le type d'événement (depuis EVENT_TYPES)
 * @param {string} detail - Description détaillée de l'événement
 * @param {object} metadata - Métadonnées additionnelles (optionnel)
 */
export function logEvent(pushHistory, projectId, eventType, detail, metadata = {}) {
  const label = DEFAULT_LABELS[eventType] || "Événement";
  pushHistory(projectId, label, detail, { ...metadata, type: eventType });
}

/**
 * Fonctions helpers pour chaque type d'événement
 * Ces fonctions facilitent l'appel depuis les composants
 */

export function logProjectCreated(pushHistory, project, metadata = {}) {
  logEvent(
    pushHistory,
    project.id,
    EVENT_TYPES.PROJECT_CREATED,
    `Le projet "${project.nom}" a été créé`,
    { project_name: project.nom, ...metadata }
  );
}

export function logProjectUpdated(pushHistory, projectId, detail = "Les informations générales du projet ont été mises à jour", metadata = {}) {
  logEvent(pushHistory, projectId, EVENT_TYPES.PROJECT_UPDATED, detail, metadata);
}

export function logProjectStatusChanged(pushHistory, projectId, oldStatus, newStatus, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.PROJECT_STATUS_CHANGED,
    `Le statut du projet est passé de "${oldStatus}" à "${newStatus}"`,
    { old_status: oldStatus, new_status: newStatus, ...metadata }
  );
}

export function logContractCreated(pushHistory, projectId, contractName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.CONTRACT_CREATED,
    `Un nouveau contrat "${contractName}" a été ajouté au projet`,
    { contract_name: contractName, ...metadata }
  );
}

export function logContractUpdated(pushHistory, projectId, contractName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.CONTRACT_UPDATED,
    `Le contrat "${contractName}" a été mis à jour`,
    { contract_name: contractName, ...metadata }
  );
}

export function logContractDeleted(pushHistory, projectId, contractName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.CONTRACT_DELETED,
    `Le contrat "${contractName}" a été supprimé du projet`,
    { contract_name: contractName, ...metadata }
  );
}

export function logDocumentAdded(pushHistory, projectId, documentName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.DOCUMENT_ADDED,
    `Le document "${documentName}" a été ajouté au projet`,
    { document_name: documentName, ...metadata }
  );
}

export function logDocumentDownloaded(pushHistory, projectId, documentName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.DOCUMENT_DOWNLOADED,
    `Le document "${documentName}" a été téléchargé`,
    { document_name: documentName, ...metadata }
  );
}

export function logTeamMemberAssigned(pushHistory, projectId, memberName, role, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.TEAM_MEMBER_ASSIGNED,
    `${memberName} a été affecté au projet en tant que ${role}`,
    { member_name: memberName, role, ...metadata }
  );
}

export function logTeamMemberRemoved(pushHistory, projectId, memberName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.TEAM_MEMBER_REMOVED,
    `${memberName} a été retiré du projet`,
    { member_name: memberName, ...metadata }
  );
}

export function logTeamMemberUpdated(pushHistory, projectId, memberName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.TEAM_MEMBER_UPDATED,
    `Les informations de ${memberName} ont été mises à jour`,
    { member_name: memberName, ...metadata }
  );
}

export function logSubcontractorAssigned(pushHistory, projectId, subcontractorName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.SUBCONTRACTOR_ASSIGNED,
    `Le sous-traitant "${subcontractorName}" a été affecté au projet`,
    { subcontractor_name: subcontractorName, ...metadata }
  );
}

export function logSubcontractorRemoved(pushHistory, projectId, subcontractorName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.SUBCONTRACTOR_REMOVED,
    `Le sous-traitant "${subcontractorName}" a été retiré du projet`,
    { subcontractor_name: subcontractorName, ...metadata }
  );
}

export function logSubcontractorUpdated(pushHistory, projectId, subcontractorName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.SUBCONTRACTOR_UPDATED,
    `Les informations du sous-traitant "${subcontractorName}" ont été mises à jour`,
    { subcontractor_name: subcontractorName, ...metadata }
  );
}

export function logCandidatureSubmitted(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_SUBMITTED,
    "La candidature a été déposée",
    metadata
  );
}

// Helpers pour les événements opportunité/candidature
export function logOpportunityCreated(pushHistory, projectId, opportunityName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_CREATED,
    `L'opportunité "${opportunityName}" a été créée`,
    { opportunity_name: opportunityName, ...metadata }
  );
}

export function logOpportunityInterested(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_INTERESTED,
    "Intérêt marqué pour cette opportunité",
    metadata
  );
}

export function logOpportunityInPreparation(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_IN_PREPARATION,
    "Préparation de la candidature démarrée",
    metadata
  );
}

export function logOpportunityReadyToSubmit(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_READY_TO_SUBMIT,
    "Candidature prête à être déposée",
    metadata
  );
}

export function logOpportunityWon(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_WON,
    "Marché gagné - Conversion en projet",
    metadata
  );
}

export function logOpportunityLost(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.OPPORTUNITY_LOST,
    "Marché perdu",
    metadata
  );
}

export function logDCEDownloaded(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.DCE_DOWNLOADED,
    "Le DCE complet a été téléchargé",
    metadata
  );
}

export function logDCEAnalysisCompleted(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.DCE_ANALYSIS_COMPLETED,
    "L'analyse IA du DCE est terminée",
    metadata
  );
}

export function logCandidatureDocumentAdded(pushHistory, projectId, documentName, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.CANDIDATURE_DOCUMENT_ADDED,
    `Le document "${documentName}" a été ajouté à la candidature`,
    { document_name: documentName, ...metadata }
  );
}

export function logPPTGenerated(pushHistory, projectId, metadata = {}) {
  logEvent(
    pushHistory,
    projectId,
    EVENT_TYPES.PPT_GENERATED,
    "La présentation PowerPoint a été générée",
    metadata
  );
}
