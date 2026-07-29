import { api, BASE_URL } from "./client";

export const traiterDce = (id) => api.post(`/appels-offres/${id}/traiter-dce`);
export const fetchAnalyseDce = (id) => api.get(`/appels-offres/${id}/analyse-dce`);
export const fetchDocumentsDce = (id) => api.get(`/appels-offres/${id}/documents-dce`);

// Lien direct vers le fichier original d'un document DCE (RC, CPS, CCAP, annexe...).
// Endpoint confirmé par le backend, servant le fichier reconstruit depuis
// appel_offres_id + chemin_relatif. Pas d'auth requise actuellement (cf. client.js).
export const documentFileUrl = (appelOffresId, documentId) =>
  `${BASE_URL}/appels-offres/${appelOffresId}/documents-dce/${documentId}/fichier`;