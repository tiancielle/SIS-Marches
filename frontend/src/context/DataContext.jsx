import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchProjects, createProjectApi, updateProjectApi, deleteProjectApi } from "../api/projects";
import {
  fetchSousTraitants,
  createSousTraitantApi,
  updateSousTraitantApi,
  deleteSousTraitantApi,
} from "../api/sousTraitants";
import { fetchContrats, createContrat, updateContrat, deleteContrat } from "../api/contrats";
import { fetchDCEList, createDCE, updateDCE, deleteDCE } from "../api/dce";
import { SEED_HISTORY_BY_PROJECT, SEED_EQUIPE } from "../lib/mockData";

const DataContext = createContext(null);

let nextEquipeId = SEED_EQUIPE.length + 1;

export function DataProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [subs, setSubs] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [dceList, setDceList] = useState([]);
  const [equipe, setEquipe] = useState(SEED_EQUIPE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // subsByProject, equipeByProject et historyByProject restent en local pour l'instant :
  // Contrat n'existe pas encore côté backend (étape 5 de notre plan).
  const [subsByProject, setSubsByProject] = useState({});
  const [equipeByProject, setEquipeByProject] = useState({}); // { projetId: [{ membreId, role }] }
  const [historyByProject] = useState(SEED_HISTORY_BY_PROJECT);

  // --- 1) Chargement initial depuis l'API (remplace SEED_PROJETS / SEED_SUBS) ---
  useEffect(() => {
    Promise.all([fetchProjects(), fetchSousTraitants(), fetchContrats(), fetchDCEList()])
      .then(([projectsData, subsData, contratsData, dceData]) => {
        setProjects(projectsData);
        setSubs(subsData);
        setContrats(contratsData);
        setDceList(dceData);
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
    setEquipeByProject((prev) => {
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

  // --- 4) CRUD Contrats ---
  const addContrat = async (data) => {
    const created = await createContrat(data);
    setContrats((prev) => [...prev, created]);
    return created;
  };

  const editContrat = async (id, data) => {
    const updated = await updateContrat(id, data);
    setContrats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const removeContrat = async (id) => {
    await deleteContrat(id);
    setContrats((prev) => prev.filter((c) => c.id !== id));
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

  // --- 6) Affectation sous-traitant ↔ projet (local, en attendant le vrai Contrat) ---
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

  // --- 7) CRUD Équipe (local, pas encore d'API) ---
  const addEquipeMembre = (data) => {
    setEquipe((prev) => [...prev, { id: nextEquipeId++, ...data }]);
  };

  const updateEquipeMembre = (id, data) => {
    setEquipe((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const removeEquipeMembre = (id) => {
    setEquipe((prev) => prev.filter((m) => m.id !== id));
    setEquipeByProject((prev) => {
      const copy = {};
      for (const key in prev) copy[key] = prev[key].filter((e) => e.membreId !== id);
      return copy;
    });
  };

  // --- 8) Affectation équipe ↔ projet ---
  const assignEquipeToProject = (projectId, membreId, role) => {
    setEquipeByProject((prev) => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [...list, { membreId, role }] };
    });
  };

  const unassignEquipe = (projectId, membreId) => {
    setEquipeByProject((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter((e) => e.membreId !== membreId),
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

  const getContratsForProject = (projetId) =>
    contrats.filter((c) => c.projet_id === projetId);

  // Relation 1:1 pour le DCE, donc .find au lieu de .filter
  const getDCEForProject = (projetId) =>
    dceList.find((d) => d.projet_id === projetId) || null;

  const getEquipeForProject = (projectId) =>
    (equipeByProject[projectId] || [])
      .map((entry) => {
        const membre = equipe.find((m) => m.id === entry.membreId);
        return membre ? { ...membre, role: entry.role } : null;
      })
      .filter(Boolean);

  const projectsForEquipeMembre = (membreId) =>
    projects.filter((p) => (equipeByProject[p.id] || []).some((e) => e.membreId === membreId));

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
        contrats, addContrat, editContrat, removeContrat, getContratsForProject,
        dceList, addDCE, editDCE, removeDCE, getDCEForProject,
        assignSubToProject, unassignSub,
        equipe, addEquipeMembre, updateEquipeMembre, removeEquipeMembre,
        assignEquipeToProject, unassignEquipe, getEquipeForProject, projectsForEquipeMembre,
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