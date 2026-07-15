import { api } from "./client";

export const fetchProjetEquipe = (projetId) =>
  api.get(projetId ? `/projet-equipe/?projet_id=${projetId}` : "/projet-equipe/");

export const assignEquipeApi = (data) => api.post("/projet-equipe/", data);
export const removeProjetEquipeApi = (id) => api.del(`/projet-equipe/${id}`);