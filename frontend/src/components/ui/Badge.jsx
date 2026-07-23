// Badge de statut réutilisable (ex: Actif, Payé, En retard) — style pastille TenderWatch.
import React from "react";
import { C, FONT } from "../../styles/theme";

const MAP = {
  actif: { label: "Actif", color: C.success },
  termine: { label: "Terminé", color: C.mute },
  brouillon: { label: "Brouillon", color: C.faint },
  nouveau: { label: "Nouveau", color: C.accent },
  analyse: { label: "Analysé", color: C.success },
  converti: { label: "Converti en projet", color: C.mute },
  ignore: { label: "Ignoré", color: C.faint },
  en_attente: { label: "En attente", color: C.faint, bg: C.paper },
  en_cours: { label: "Analyse en cours", color: C.accent, bg: C.accentLt },
  complete: { label: "Analyse complète", color: C.success, bg: "#EAF2E7" },
  partielle: { label: "Analyse partielle", color: C.warning, bg: "#FBF1E1" },
  echec: { label: "Échec de l'analyse", color: C.danger, bg: "#FBEAE9" },
  
  // NOUVEAUX STATUTS PROJET / MARCHÉ
  interesse: { label: "Intéressé", color: C.accent, bg: C.accentLt },
  en_preparation: { label: "En préparation", color: "#8A6A1F", bg: "#F3E8D0" },
  soumis: { label: "Soumis", color: "#2F6FB0", bg: "#EAF2FA" },
  gagne: { label: "Gagné", color: C.success, bg: "#EAF2E7" },
  perdu: { label: "Perdu", color: C.danger, bg: "#FBEAE9" },
  abandonne: { label: "Abandonné", color: C.faint, bg: C.paper },
  en_execution: { label: "En exécution", color: C.success, bg: "#EAF2E7" },
};

export default function Badge({ status }) {
  const s = MAP[status] || MAP.brouillon;
  return (
    <span style={{ 
      fontFamily: FONT, 
      fontSize: 12.5, 
      fontWeight: 600, 
      color: s.color,
      background: s.bg || "transparent", // Fallback transparent si 'bg' n'est pas défini
      padding: "2px 8px",
      borderRadius: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }}>
      ● {s.label}
    </span>
  );
}