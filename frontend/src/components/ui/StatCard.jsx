// Carte KPI réutilisable (icône + valeur + sous-texte) — utilisée par le Dashboard et
// potentiellement toute autre vue nécessitant des métriques (Finances, Ressources...).
// Parti pris : pas d'icône colorée en gros pictogramme, pas de fond de couleur —
// la hiérarchie vient de la taille de la valeur et de l'espace, pas de la décoration.
import React from "react";
import { C, FONT, FONT_DISPLAY } from "../../styles/theme";

export default function StatCard({ label, value, icon: Icon, subtext, tone = "neutral" }) {
  const toneColor = tone === "success" ? C.success : tone === "warning" ? C.warning : tone === "danger" ? C.danger : C.mute;

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: C.radius,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint,
            textTransform: "uppercase", letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        {Icon && <Icon size={15} strokeWidth={1.75} color={C.faint} />}
      </div>

      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: C.ink, lineHeight: 1 }}>
        {value}
      </span>

      {subtext && (
        <span style={{ fontFamily: FONT, fontSize: 12, color: toneColor, fontWeight: 500 }}>
          {subtext}
        </span>
      )}
    </div>
  );
}
