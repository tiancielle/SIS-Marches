import { api } from "./client";

export const fetchDCEList = (projetId) =>
  api.get(projetId ? `/dce/?projet_id=${projetId}` : "/dce/");

export const fetchDCE = (id) => api.get(`/dce/${id}`);

export const createDCE = (data) => api.post("/dce/", data);

export const updateDCE = (id, data) => api.put(`/dce/${id}`, data);

export const deleteDCE = (id) => api.del(`/dce/${id}`);