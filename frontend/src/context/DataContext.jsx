import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchProjects, createProjectApi, updateProjectApi, deleteProjectApi } from "../api/projects";
import {
  fetchSousTraitants,
  createSousTraitantApi,
  updateSousTraitantApi,
  deleteSousTraitantApi,
} from "../api/sousTraitants";
import { SEED_HISTORY_BY_PROJECT } from "../lib/mockData";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // subsByProject et historyByProject restent en local pour l'instant :
  // Contrat n'existe pas encore côté backend (étape 5 de notre plan).
  const [subsByProject, setSubsByProject] = useState({});
  const [historyByProject] = useState(SEED_HISTORY_BY_PROJECT);

  // --- 1) Chargement initial depuis l'API (remplace SEED_PROJETS / SEED_SUBS) ---
  useEffect(() => {
    Promise.all([fetchProjects(), fetchSousTraitants()])
      .then(([projectsData, subsData]) => {
        setProjects(projectsData);
        setSubs(subsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // --- 2) CRUD Projets — chaque fonction appelle l'API, puis met à jour le state local ---
  const addProject = async (data) => {
    const created = await createProjectApi(data);
    setProjects((prev) => [...prev, created]);
    return created;
  };

  const updateProject = async (id, data) => {
    const updated = await updateProjectApi(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteProject = async (id) => {
    await deleteProjectApi(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSubsByProject((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // --- 3) CRUD Sous-traitants — même logique ---
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
    setSubsByProject((prev) => {
      const copy = {};
      for (const key in prev) copy[key] = prev[key].filter((e) => e.subId !== id);
      return copy;
    });
  };

  // --- 4) Affectation sous-traitant ↔ projet (local, en attendant le vrai Contrat) ---
  const assignSubToProject = (projectId, subId, contratRef, file) => {
    setSubsByProject((prev) => {
      const list = prev[projectId] || [];
      return {
        ...prev,
        [projectId]: [
          ...list,
          {
            subId,
            contratRef: contratRef || null,
            document: !!file,
            fileUrl: file ? URL.createObjectURL(file) : null,
            fileName: file ? file.name : null,
          },
        ],
      };
    });
  };

  const unassignSub = (projectId, subId) => {
    setSubsByProject((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((e) => e.subId !== subId),
    }));
  };

  // --- Sélecteurs dérivés — inchangés, toujours basés sur l'état LIVE ---
  const getSubsForProject = (projectId) =>
    (subsByProject[projectId] || [])
      .map((entry) => {
        const sub = subs.find((s) => s.id === entry.subId);
        return sub
          ? {
              ...sub,
              contratRef: entry.contratRef,
              document: entry.document,
              fileUrl: entry.fileUrl,
              fileName: entry.fileName,
            }
          : null;
      })
      .filter(Boolean);

  const subProjectCount = (subId) =>
    Object.values(subsByProject).filter((list) => list.some((e) => e.subId === subId)).length;

  const projectsForSub = (subId) =>
    projects.filter((p) => (subsByProject[p.id] || []).some((e) => e.subId === subId));

  const getHistoryForProject = (projectId) => historyByProject[projectId] || [];

  return (
    <DataContext.Provider
      value={{
        projects, addProject, updateProject, deleteProject,
        subs, addSub, updateSub, deleteSub,
        assignSubToProject, unassignSub,
        getSubsForProject, subProjectCount, projectsForSub, getHistoryForProject,
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