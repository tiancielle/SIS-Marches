import { api } from "./client";

export const fetchEquipe = () => api.get("/equipe/");
export const createEquipeMembre = (data) => api.post("/equipe/", data);
export const updateEquipeMembre = (id, data) => api.put(`/equipe/${id}`, data);
export const deleteEquipeMembre = (id) => api.del(`/equipe/${id}`);