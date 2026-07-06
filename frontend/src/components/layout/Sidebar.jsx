import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, FileText, Receipt, Wallet } from "lucide-react";
import { C, FONT } from "../../styles/theme";

// Un item = une route. On respecte l'ordre de construction :
// Projects et SousTraitants d'abord, Dashboard en dernier (mais affiché en haut par convention).
const ITEMS = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/projects", label: "Projets", icon: FolderKanban },
  { to: "/sous-traitants", label: "Sous-traitants", icon: Users },
  { to: "/contrats", label: "Contrats", icon: FileText },
  { to: "/factures", label: "Factures", icon: Receipt },
  { to: "/paiements", label: "Paiements", icon: Wallet },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: C.card,
        borderRight: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ padding: "4px 12px 24px" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: -0.2 }}>
          SIS Consultants
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11.5, color: C.faint, marginTop: 1 }}>
          Suivi des marchés
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 6,
              textDecoration: "none",
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? C.ink : C.mute,
              background: isActive ? C.paper : "transparent",
              borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
            })}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
