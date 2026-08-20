import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchProjects, createProjectApi, updateProjectApi, deleteProjectApi } from "../services/projects";
import {
  fetchSousTraitants, createSousTraitantApi, updateSousTraitantApi, deleteSousTraitantApi,
} from "../services/sousTraitants";
import { fetchContrats, createContrat, updateContrat, deleteContrat } from "../services/contrats";
import { fetchDCEList, createDCE, updateDCE, deleteDCE } from "../services/dce";
import { fetchEquipe, createEquipeMembre, updateEquipeMembre as updateEquipeMembreApi, deleteEquipeMembre } from "../services/equipe";
import { fetchProjetEquipe, assignEquipeApi, removeProjetEquipeApi } from "../services/projetEquipe";
import { changerStatutProjet, getHistoriqueProjet, ajouterEvenementHistorique } from "../services/workflow";
import { SEED_MARCHES, SEED_ANALYSES } from "../lib/mockData";
import {
  logProjectCreated,
  logProjectUpdated,
  logProjectStatusChanged,
  logContractCreated,
  logContractUpdated,
  logContractDeleted,
  logTeamMemberAssigned,
  logTeamMemberRemoved,
  logOpportunityInterested,
  logOpportunityInPreparation,
  logOpportunityReadyToSubmit,
  logOpportunityWon,
  logOpportunityLost,
} from "../modules/projets/lib/eventHistory";

const DataContext = createContext(null);

let nextMarcheId = SEED_MARCHES.length + 1;
let nextAnalyseId = SEED_ANALYSES.length + 1;

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [subs, setSubs] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [dceList, setDceList] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [equipeAssignments, setEquipeAssignments] = useState([]); // réponse enrichie de l'API (nom/intitule/... déjà joints)
  const [marches, setMarches] = useState(SEED_MARCHES);
  const [analyses, setAnalyses] = useState(SEED_ANALYSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // historyByProject devient un vrai state mutable (plus une const figée)
  const [historyByProject, setHistoryByProject] = useState({});

  // State pour les fichiers (le backend n'a qu'un champ texte document_nom, pas de vrai stockage)
  const [contratFiles, setContratFilesState] = useState({}); // { contratId: { fileUrl, fileName } }
  const [dceFiles, setDceFilesState] = useState({}); // { dceId: { fileUrl, fileName } }

  // --- 1) Chargement initial depuis l'API ---
  useEffect(() => {
    Promise.all([
      fetchProjects(),
      fetchSousTraitants(),
      fetchContrats(),
      fetchDCEList(),
      fetchEquipe(),
      fetchProjetEquipe(),
    ])
      .then(([projectsData, subsData, contratsData, dceData, equipeData, assignData]) => {
        setProjects(projectsData);
        setSubs(subsData);
        setContrats(contratsData);
        setDceList(dceData);
        setEquipe(equipeData);
        setEquipeAssignments(assignData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // --- 2) CRUD Projets ---
  const addProject = async (data) => {
    const created = await createProjectApi(data);
    setProjects((prev) => [...prev, created]);
    logProjectCreated(pushHistory, created);
    return created;
  };

  // Insère dans le state un projet déjà créé côté backend par un autre flux
  // (ex: conversion AppelOffres → Projet via "Je suis intéressé"), sans re-POST.
  // Sans ça, DataContext continue de travailler avec sa copie chargée au démarrage
  // et le projet reste invisible jusqu'au prochain rechargement complet de la page.
  const addProjectToState = (projet) => {
    setProjects((prev) => (prev.some((p) => p.id === projet.id) ? prev : [...prev, projet]));
    logProjectCreated(pushHistory, projet);
  };

  const updateProject = async (id, data) => {
    const updated = await updateProjectApi(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logProjectUpdated(pushHistory, id);
    return updated;
  };

  const deleteProject = async (id) => {
    await deleteProjectApi(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEquipeAssignments((prev) => prev.filter((a) => a.projet_id !== id));
  };

  // --- 3) CRUD Sous-traitants ---
  const addSub = async (data) => {
    const created = await createSousTraitantApi(data);
    setSubs((prev) => [...prev, created]);
    return created;
  };

  const updateSub = async (id, data) => {
    const updated = await updateSousTraitantApi(id, data);
    setSubs((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteSub = async (id) => {
    await deleteSousTraitantApi(id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  // --- 4) CRUD Contrats ---
  const addContrat = async (data) => {
    const created = await createContrat(data);
    setContrats((prev) => [...prev, created]);
    if (data.projet_id) {
      logContractCreated(pushHistory, data.projet_id, created.nom || "Contrat");
    }
    return created;
  };

  const editContrat = async (id, data) => {
    const updated = await updateContrat(id, data);
    setContrats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    if (updated.projet_id) {
      logContractUpdated(pushHistory, updated.projet_id, updated.nom || "Contrat");
    }
    return updated;
  };

  const removeContrat = async (id) => {
    const contrat = contrats.find((c) => c.id === id);
    await deleteContrat(id);
    setContrats((prev) => prev.filter((c) => c.id !== id));
    if (contrat?.projet_id) {
      logContractDeleted(pushHistory, contrat.projet_id, contrat.nom || "Contrat");
    }
  };

  // --- 5) CRUD DCE ---
  const addDCE = async (data) => {
    const created = await createDCE(data);
    setDceList((prev) => [...prev, created]);
    return created;
  };

  const editDCE = async (id, data) => {
    const updated = await updateDCE(id, data);
    setDceList((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const removeDCE = async (id) => {
    await deleteDCE(id);
    setDceList((prev) => prev.filter((d) => d.id !== id));
  };

  // --- 6) Utilitaire d'historique (persisté en backend) ---
  const pushHistory = async (projetId, label, detail, metadata = {}) => {
    // Envoyer l'événement au backend pour persistance
    try {
      const eventType = metadata?.type || "evenement";
      const backendEvent = await ajouterEvenementHistorique(
        projetId,
        eventType,
        label,
        detail,
        metadata
      );
      
      // Mettre à jour le state local avec l'événement du backend
      setHistoryByProject((prev) => {
        const list = prev[projetId] || [];
        return { 
          ...prev, 
          [projetId]: [
            {
              id: backendEvent.id,
              date: backendEvent.date,
              label: backendEvent.label,
              detail: backendEvent.detail,
              metadata: backendEvent.metadata,
            },
            ...list
          ]
        };
      });
    } catch (error) {
      console.error("Failed to save event to backend:", error);
      // En cas d'erreur, fallback sur le stockage local temporaire
      setHistoryByProject((prev) => {
        const list = prev[projetId] || [];
        const newEvent = { 
          id: Date.now(), 
          date: new Date().toISOString().slice(0, 10), 
          label, 
          detail, 
          metadata 
        };
        return { ...prev, [projetId]: [...list, newEvent] };
      });
    }
  };

  // --- 7) CRUD Équipe (via API backend) ---
  const addEquipeMembre = async (data) => {
    const created = await createEquipeMembre(data);
    setEquipe((prev) => [...prev, created]);
    return created;
  };

  const updateEquipeMembre = async (id, data) => {
    const updated = await updateEquipeMembreApi(id, data);
    setEquipe((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const removeEquipeMembre = async (id) => {
    await deleteEquipeMembre(id);
    setEquipe((prev) => prev.filter((m) => m.id !== id));
    setEquipeAssignments((prev) => prev.filter((a) => a.equipe_id !== id));
  };

  // --- 8) Affectation équipe ↔ projet (via API backend) ---
  const assignEquipeToProject = async (projetId, equipeId, role) => {
    const created = await assignEquipeApi({ projet_id: projetId, equipe_id: equipeId, role });
    setEquipeAssignments((prev) => [...prev, created]);
    const membre = equipe.find((m) => m.id === equipeId);
    logTeamMemberAssigned(pushHistory, projetId, membre?.nom || "Membre", role);
  };

  const unassignEquipe = async (assignmentId, projetId) => {
    const assignment = equipeAssignments.find((a) => a.id === assignmentId);
    await removeProjetEquipeApi(assignmentId);
    setEquipeAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    if (assignment) logTeamMemberRemoved(pushHistory, projetId, assignment.nom);
  };

  // --- 9) Gestion des fichiers (stockage local) ---
  const setContratFile = (contratId, file) => {
    if (!file) return;
    setContratFilesState((prev) => ({ ...prev, [contratId]: { fileUrl: URL.createObjectURL(file), fileName: file.name } }));
  };

  const setDceFile = (dceId, file) => {
    if (!file) return;
    setDceFilesState((prev) => ({ ...prev, [dceId]: { fileUrl: URL.createObjectURL(file), fileName: file.name } }));
  };

  // --- 10) Marchés Publics & Analyses (Simulation frontend pour l'instant) ---
  const addMarche = (data) => {
    setMarches((prev) => [...prev, { id: nextMarcheId++, statut: "nouveau", date_import: new Date().toISOString().slice(0, 10), ...data }]);
  };

  const ignoreMarche = (id) => {
    setMarches((prev) => prev.map((m) => (m.id === id ? { ...m, statut: "ignore" } : m)));
  };

  const analyserMarche = async (id) => {
    const marche = marches.find((m) => m.id === id);
    if (!marche) return;
    await new Promise((r) => setTimeout(r, 600)); // simule la latence d'un appel LLM

    const fauxScore = Math.floor(40 + Math.random() * 55);
    const analyse = {
      id: nextAnalyseId++,
      marche_public_id: id,
      resume: `Marché portant sur : ${marche.objet.slice(0, 100)}...`,
      mots_cles: ["digitalisation", "assistance technique", "secteur public"],
      technologies_detectees: ["gestion documentaire", "conseil organisationnel"],
      score_pertinence: fauxScore,
      justification: "Analyse simulée (frontend) — le vrai appel IA sera fait côté backend une fois l'endpoint prêt.",
      recommandations: "À valider une fois l'analyse réelle branchée.",
      modele_utilise: "simulation-frontend",
      date_analyse: new Date().toISOString(),
    };

    setAnalyses((prev) => [...prev.filter((a) => a.marche_public_id !== id), analyse]);
    setMarches((prev) => prev.map((m) => (m.id === id ? { ...m, statut: "analyse" } : m)));
  };

  const getAnalyseForMarche = (id) => analyses.find((a) => a.marche_public_id === id) || null;

  const selectMarche = async (marcheId) => {
    const marche = marches.find((m) => m.id === marcheId);
    if (!marche) return;
    const today = new Date().toISOString().slice(0, 10);

    const createdProject = await addProject({
      nom: marche.objet.slice(0, 80), client: marche.organisme, lieu: "", chef: "",
      budget: marche.montant_estimatif || 0, budget_engage: 0,
      debut: today, fin: marche.date_limite_remise || today, statut: "brouillon",
    });

    await addDCE({
      projet_id: createdProject.id, objet: marche.objet, organisme: marche.organisme,
      montant_estimatif: marche.montant_estimatif, date_limite_remise: marche.date_limite_remise,
      type_procedure: marche.type_procedure, pieces_exigees: "", document_nom: null,
    });

    setMarches((prev) => prev.map((m) => (m.id === marcheId ? { ...m, statut: "converti" } : m)));
    return createdProject.id;
  };

  // --- Sélecteurs dérivés — basés sur l'état LIVE ---
  const getContratsForProject = (projetId) =>
    contrats.filter((c) => c.projet_id === projetId);

  const getContratsForSub = (subId) =>
    contrats.filter((c) => c.sous_traitant_id === subId);

  // Relation 1:1 pour le DCE, donc .find au lieu de .filter
  const getDCEForProject = (projetId) =>
    dceList.find((d) => d.projet_id === projetId) || null;

  // Les affectations sont déjà enrichies par l'API (nom, intitule, type, email, phone)
  const getEquipeForProject = (projetId) =>
    equipeAssignments.filter((a) => a.projet_id === projetId);

  const projectsForEquipeMembre = (equipeId) =>
    projects.filter((p) => equipeAssignments.some((a) => a.projet_id === p.id && a.equipe_id === equipeId));

  // Sélecteurs sous-traitants basés sur les vrais contrats
  const subProjectCount = (subId) =>
    contrats.filter((c) => c.sous_traitant_id === subId).length;

  const projectsForSub = (subId) =>
    projects.filter((p) => contrats.some((c) => c.sous_traitant_id === subId && c.projet_id === p.id));

  const getHistoryForProject = (projectId) => historyByProject[projectId] || [];

  // --- 11) Workflow transitions ---
  const changeProjectStatut = async (projetId, nouveauStatut) => {
    const project = projects.find((p) => p.id === projetId);
    const oldStatut = project?.statut;
    const updated = await changerStatutProjet(projetId, nouveauStatut);
    setProjects((prev) => prev.map((p) => (p.id === projetId ? updated : p)));
    
    // Logger l'événement approprié selon le type de changement
    if (nouveauStatut === "interesse") {
      logOpportunityInterested(pushHistory, projetId);
    } else if (nouveauStatut === "en_preparation") {
      logOpportunityInPreparation(pushHistory, projetId);
    } else if (nouveauStatut === "pret_a_deposer") {
      logOpportunityReadyToSubmit(pushHistory, projetId);
    } else if (nouveauStatut === "soumis") {
      // logOpportunitySubmitted est déjà appelé ailleurs si nécessaire
      logProjectStatusChanged(pushHistory, projetId, oldStatut, nouveauStatut);
    } else if (nouveauStatut === "gagne") {
      logOpportunityWon(pushHistory, projetId);
    } else if (nouveauStatut === "perdu") {
      logOpportunityLost(pushHistory, projetId);
    } else {
      logProjectStatusChanged(pushHistory, projetId, oldStatut, nouveauStatut);
    }
    
    return updated;
  };

  const fetchHistorique = async (projetId) => {
    const historique = await getHistoriqueProjet(projetId);
    // S'assurer que les événements du backend ont la structure attendue
    const normalizedHistorique = historique.map(e => ({
      id: e.id || Date.now() + Math.random(),
      date: e.date || e.created_at || new Date().toISOString().slice(0, 10),
      label: e.label || e.titre || e.type || "Événement",
      detail: e.detail || e.description || "",
      metadata: e.metadata || { type: e.type },
    }));
    setHistoryByProject((prev) => ({ ...prev, [projetId]: normalizedHistorique }));
    return normalizedHistorique;
  };

  return (
    <DataContext.Provider
      value={{
        projects, addProject, addProjectToState, updateProject, deleteProject,
        subs, addSub, updateSub, deleteSub,
        contrats, addContrat, editContrat, removeContrat, getContratsForProject, getContratsForSub,
        contratFiles, setContratFile,
        dceList, addDCE, editDCE, removeDCE, getDCEForProject,
        dceFiles, setDceFile,
        equipe, addEquipeMembre, updateEquipeMembre, removeEquipeMembre,
        assignEquipeToProject, unassignEquipe, getEquipeForProject, projectsForEquipeMembre,
        marches, addMarche, ignoreMarche, analyserMarche, getAnalyseForMarche, selectMarche,
        analyses,
        subProjectCount, projectsForSub, getHistoryForProject,
        changeProjectStatut, fetchHistorique,
        loading, error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé à l'intérieur de <DataProvider>");
  return ctx;
}