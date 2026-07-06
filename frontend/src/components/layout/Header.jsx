import React from "react";
import { Search, Plus } from "lucide-react";
import { C, FONT } from "../../styles/theme";

// Header réutilisable pour chaque page (Projects, SousTraitants, ...).
// title/subtitle à gauche ; recherche + bouton d'action à droite (optionnels).
export default function Header({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "22px 32px",
        borderBottom: `1px solid ${C.line}`,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onSearchChange && (
          <div style={{ position: "relative" }}>
            <Search size={15} color={C.faint} style={{ position: "absolute", left: 11, top: 9 }} />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: C.ink,
                width: 220,
                padding: "8px 12px 8px 32px",
                borderRadius: 6,
                border: `1px solid ${C.line}`,
                background: C.paper,
                outline: "none",
              }}
            />
          </div>
        )}
        {onAction && (
          <button
            onClick={onAction}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              color: "#fff",
              background: C.accent,
              border: "none",
              borderRadius: 6,
              padding: "9px 14px",
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
