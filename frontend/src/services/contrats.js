import { api } from "./client";

export const fetchContrats = (projetId) =>
  api.get(projetId ? `/contrats/?projet_id=${projetId}` : "/contrats/");

export const fetchContrat = (id) => api.get(`/contrats/${id}`);

export const createContrat = (data) => api.post("/contrats/", data);

export const updateContrat = (id, data) => api.put(`/contrats/${id}`, data);

export const deleteContrat = (id) => api.del(`/contrats/${id}`);