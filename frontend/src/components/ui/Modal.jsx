// Panneau latéral générique utilisé par tous les formulaires (création/édition).
// Remplace l'ancienne "carte flottante centrée" par un drawer qui glisse depuis la droite,
// esprit Linear / Stripe — plus adapté à la saisie de formulaires que la carte modale.
import React from "react";
import { X } from "lucide-react";
import { C, FONT } from "../../styles/theme";

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.25)",
        zIndex: 50, animation: "sis-overlay-in 0.15s ease-out",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes sis-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sis-drawer-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 0, right: 0, height: "100vh",
          width: 460, maxWidth: "92vw",
          background: C.card,
          borderRadius: "12px 0 0 12px",
          boxShadow: "-8px 0 24px rgba(17,24,39,0.10)",
          display: "flex", flexDirection: "column",
          animation: "sis-drawer-in 0.2s ease-out",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${C.line}`, flexShrink: 0,
        }}>
          <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.mute,
            padding: 4, borderRadius: 6, display: "flex",
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>

        {footer && (
          <div style={{
            padding: "16px 24px", borderTop: `1px solid ${C.line}`,
            display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}