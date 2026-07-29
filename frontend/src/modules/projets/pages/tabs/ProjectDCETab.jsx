import React from "react";
import { FileSearch } from "lucide-react";
import AnalyseDcePanel from "../../../veille/pages/AnalyseDcePanel";
import { C, FONT, FONT_DISPLAY } from "../../../../styles/theme";

// Le Projet n'a plus de fiche DCE manuelle propre (ancien CRUD services/dce.js) :
// quand le projet est issu d'un appel d'offres, le DCE et son analyse IA sont ceux
// de l'AO d'origine, migrés automatiquement — jamais recalculés depuis le Projet
// (voir readOnly ci-dessous). On réutilise donc AnalyseDcePanel tel quel, en lecture
// seule, pour ne jamais diverger visuellement de ce qu'affiche le module Veille pour
// la même donnée.
export default function ProjectDCETab({ project }) {
  if (!project.appel_offres_id) {
    return (
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
        padding: "48px 32px", textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: C.paper, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.faint,
        }}>
          <FileSearch size={18} strokeWidth={1.75} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
          Aucun DCE à afficher
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.faint, maxWidth: 360, margin: "0 auto" }}>
          Ce projet n'est pas issu d'un appel d'offres — il n'y a donc pas de dossier de consultation ni d'analyse IA associés.
        </div>
      </div>
    );
  }

  return <AnalyseDcePanel appelOffresId={project.appel_offres_id} readOnly />;
}