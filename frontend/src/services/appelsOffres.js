// Appels API pour le module Appels d'Offres (veille des marchés publics).
// Aligné sur backend/app/routers/appel_offres.py — ne pas ajouter d'appel
// vers un endpoint qui n'existe pas côté backend (ex: pas de POST de création
// manuelle, pas d'endpoint "intéressé" pour l'instant).
import { api } from "./client";

export const fetchAppelsOffres = (statut) =>
  api.get(statut ? `/appels-offres/?statut=${encodeURIComponent(statut)}` : "/appels-offres/");

export const fetchAppelOffre = (id) => api.get(`/appels-offres/${id}`);

export const synchroniserAppelsOffres = () => api.post("/appels-offres/synchroniser");

export const telechargerDCE = (id) => api.post(`/appels-offres/${id}/telecharger-dce`);

export const ignorerAppelOffre = (id) => api.post(`/appels-offres/${id}/ignorer`);

export const reactiverAppelOffre = (id) => api.post(`/appels-offres/${id}/reactiver`);