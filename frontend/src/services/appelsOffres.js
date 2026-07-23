// Appels API pour le module Appels d'Offres (veille des marchés publics).
import { api, BASE_URL } from "./client";

export function resolveFileUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.replace(/^\./, "")}`;
}

export const fetchAppelsOffres = (statut) =>
  api.get(statut ? `/appels-offres/?statut=${encodeURIComponent(statut)}` : "/appels-offres/");

export const fetchAppelOffre = (id) => api.get(`/appels-offres/${id}`);

export const synchroniserAppelsOffres = () => api.post("/appels-offres/synchroniser");

export const telechargerDCE = (id) => api.post(`/appels-offres/${id}/telecharger-dce`);

export const ignorerAppelOffre = (id) => api.post(`/appels-offres/${id}/ignorer`);

export const reactiverAppelOffre = (id) => api.post(`/appels-offres/${id}/reactiver`);

export const interesserAppelOffre = (id, payload) => api.post(`/appels-offres/${id}/interesser`, payload);