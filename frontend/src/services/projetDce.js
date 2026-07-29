// Lecture seule de l'analyse DCE et des documents d'un Projet, via l'appel d'offres
// d'origine (project.appel_offres_id). Ce sont volontairement les MÊMES endpoints que
// ceux utilisés côté module Veille (services/analyseDce.js) : le backend a confirmé
// qu'ils ne font qu'un SELECT et ne déclenchent jamais de traitement IA — donc aucun
// endpoint dédié "projet" n'est nécessaire, et on évite toute divergence de format
// entre l'affichage AO et l'affichage Projet de la même donnée.
//
// Important : ce fichier n'expose PAS traiterDce (déclenchement d'analyse). Le Projet
// ne doit jamais pouvoir relancer un calcul IA — voir AnalyseDcePanel avec readOnly=true.
import { fetchAnalyseDce, fetchDocumentsDce } from "./analyseDce";

export const fetchAnalyseDceForProjet = (appelOffresId) => fetchAnalyseDce(appelOffresId);

export const fetchDocumentsDceForProjet = (appelOffresId) => fetchDocumentsDce(appelOffresId);