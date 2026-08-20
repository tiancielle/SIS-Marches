import { api, BASE_URL } from "./client";

// Checklist persistante des pièces du dossier de candidature d'un Projet.
// Pré-remplie automatiquement par le backend à la conversion AO → Projet
// (POST /appels-offres/{id}/interesser) à partir de analyse_dce.pieces_administratives.
// Le frontend ne dérive plus la liste en direct depuis l'analyse : c'est cette
// table qui porte l'état persistant (statut + fichier joint par l'utilisateur).
export const fetchPiecesDossier = (projetId) => api.get(`/projets/${projetId}/pieces-dossier`);

export const updatePieceDossierStatut = (projetId, pieceId, statut) =>
  api.patch(`/projets/${projetId}/pieces-dossier/${pieceId}`, { statut });

export const uploadPieceDossierDocument = (projetId, pieceId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.postForm(`/projets/${projetId}/pieces-dossier/${pieceId}/document`, formData);
};

// Renvoie 404 tant qu'aucun fichier n'a été joint — ne construire ce lien que si
// piece.document_path (ou équivalent) est déjà renseigné, jamais en dur.
export const pieceDossierDocumentUrl = (projetId, pieceId) =>
  `${BASE_URL}/projets/${projetId}/pieces-dossier/${pieceId}/document`;

// Télécharger tous les documents déposés en ZIP
export const piecesDossierZipUrl = (projetId) =>
  `${BASE_URL}/projets/${projetId}/pieces-dossier/zip`;