// Appels API CRUD pour l'entité Projet. PRIORITÉ 1.
import { api } from "./client";

export const fetchProjects = () => api.get("/projets/");
export const createProjectApi = (data) => api.post("/projets/", data);
export const updateProjectApi = (id, data) => api.put(`/projets/${id}`, data);
export const deleteProjectApi = (id) => api.del(`/projets/${id}`);