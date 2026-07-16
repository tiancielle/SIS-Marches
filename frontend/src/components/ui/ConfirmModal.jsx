import React from "react";
import { C, FONT } from "../../styles/theme";

export default function ConfirmModal({ title, message, confirmLabel = "Supprimer", onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: C.radius, width: 380, maxWidth: "90vw",
          boxShadow: "0 8px 32px rgba(17,24,39,0.16)", padding: 24,
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 700, color: C.ink }}>{title}</span>
        <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.mute, margin: "8px 0 0" }}>{message}</p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
          <button onClick={onCancel} style={btnGhost}>Annuler</button>
          <button onClick={onConfirm} style={btnDanger}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const btnGhost = {
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute,
  background: "none", border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "8px 14px", cursor: "pointer",
};
const btnDanger = {
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff",
  background: C.danger, border: "none", borderRadius: C.radius, padding: "8px 14px", cursor: "pointer",
};