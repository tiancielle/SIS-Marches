import { api } from "./client";

export const traiterDce = (id) => api.post(`/appels-offres/${id}/traiter-dce`);
export const fetchAnalyseDce = (id) => api.get(`/appels-offres/${id}/analyse-dce`);
export const fetchDocumentsDce = (id) => api.get(`/appels-offres/${id}/documents-dce`);
