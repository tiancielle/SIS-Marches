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
};

export default function Badge({ status }) {
  const s = MAP[status] || MAP.brouillon;
  return (
    <span style={{ 
      fontFamily: FONT, 
      fontSize: 12.5, 
      fontWeight: 600, 
      color: s.color,
      background: s.bg // Ajouté pour que les nouvelles clés avec 'bg' fonctionnent correctement
    }}>
      ● {s.label}
    </span>
  );
}