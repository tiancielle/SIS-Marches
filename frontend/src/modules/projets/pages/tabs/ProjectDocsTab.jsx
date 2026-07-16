import React from "react";
import { C, FONT } from "../../../../styles/theme";

export default function ProjectDocsTab() {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
      padding: 32, textAlign: "center", color: C.faint, fontFamily: FONT, fontSize: 13.5
    }}>
      Contrats & documents — à venir (dépend du module Contrats)
    </div>
  );
}