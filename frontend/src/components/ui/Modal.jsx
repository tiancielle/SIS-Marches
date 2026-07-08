// Fenêtre modale générique utilisée par tous les formulaires (création/édition).
import React from "react";
import { X } from "lucide-react";
import { C, FONT } from "../../styles/theme";

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(18,24,43,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 8, width: 480, maxWidth: "90vw",
          border: `1px solid ${C.line}`,
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 22px", borderBottom: `1px solid ${C.line}`
        }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.mute }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 22 }}>{children}</div>

        {footer && (
          <div style={{
            padding: "14px 22px", borderTop: `1px solid ${C.line}`,
            display: "flex", justifyContent: "flex-end", gap: 8
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}