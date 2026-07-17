import React from "react";
import { FileStack } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../../styles/theme";

export default function ProjectDocsTab() {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
      padding: "48px 32px", textAlign: "center",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: C.paper, border: `1px solid ${C.line}`,
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.faint,
      }}>
        <FileStack size={18} strokeWidth={1.75} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
        Documents — bientôt disponible
      </div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: C.faint, maxWidth: 360, margin: "0 auto" }}>
        Cette section centralisera les contrats et documents du projet une fois le module Contrats connecté.
      </div>
    </div>
  );
}