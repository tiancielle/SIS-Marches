import React from "react";
import { Search, Plus, Bell } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../styles/theme";

export default function Header({ title, subtitle, searchValue, onSearchChange, searchPlaceholder = "Rechercher…", actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "22px 32px", borderBottom: `1px solid ${C.line}`, flexWrap: "wrap", background: C.card }}>
      <div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink, margin: 0 }}>{title}</h1>
        {subtitle && <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onSearchChange && (
          <div style={{ position: "relative" }}>
            <Search size={15} color={C.faint} style={{ position: "absolute", left: 11, top: 9 }} />
            <input value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder}
              style={{ fontFamily: FONT, fontSize: 13, color: C.ink, width: 220, padding: "8px 12px 8px 32px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.paper, outline: "none" }} />
          </div>
        )}
        {onAction && (
          <button onClick={onAction} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: C.radius, padding: "9px 14px", cursor: "pointer", boxShadow: C.shadow }}>
            <Plus size={15} /> {actionLabel}
          </button>
        )}
        <button style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Notifications">
          <Bell size={15} color={C.mute} />
        </button>
      </div>
    </div>
  );
}