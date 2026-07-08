// Appels API CRUD pour l'entité Sous-traitant. PRIORITÉ 1.
import { api } from "./client";

export const fetchSousTraitants = () => api.get("/sous-traitants/");
export const createSousTraitantApi = (data) => api.post("/sous-traitants/", data);
export const updateSousTraitantApi = (id, data) => api.put(`/sous-traitants/${id}`, data);
export const deleteSousTraitantApi = (id) => api.del(`/sous-traitants/${id}`);