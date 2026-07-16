import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ChevronRight, FileSearch, Sparkles, FolderKanban,
  FileText, ClipboardList, Users, Users2, Receipt, Wallet, Settings, LogOut,
} from "lucide-react";
import { C, FONT } from "../../styles/theme";

const GROUPS = [
  {
    id: "veille",
    label: "Veille",
    icon: FileSearch,
    items: [
      { to: "/marches", label: "Marchés publics" },
      { label: "Alertes IA", disabled: true },
    ],
  },
  {
    id: "projets",
    label: "Projets",
    icon: FolderKanban,
    items: [
      { to: "/projects", label: "Tous les projets" },
      { label: "DCE", disabled: true },
      { to: "/contrats", label: "Contrats" },
    ],
  },
  {
    id: "ressources",
    label: "Ressources",
    icon: Users,
    items: [
      { to: "/equipe", label: "Équipe" },
      { to: "/sous-traitants", label: "Sous-traitants" },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    icon: Wallet,
    items: [
      { to: "/factures", label: "Factures" },
      { to: "/paiements", label: "Paiements" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    items: [],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const active = GROUPS.find((g) => g.items.some((i) => i.to && location.pathname.startsWith(i.to)));
  const [openId, setOpenId] = useState(active?.id ?? null);

  return (
    <aside style={{ width: 236, flexShrink: 0, background: C.sidebarBg, display: "flex", flexDirection: "column", padding: "20px 12px", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
      <div style={{ padding: "4px 12px 22px" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: -0.2 }}>SIS Consultants</div>
        <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Suivi des marchés</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <NavLink to="/dashboard" style={({ isActive }) => rowStyle(isActive)}>
          <LayoutDashboard size={16} strokeWidth={2} />
          Tableau de bord
        </NavLink>

        {GROUPS.map((group) => {
          const isOpen = openId === group.id;
          return (
            <div key={group.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : group.id)}
                style={{
                  ...rowStyle(false), width: "100%", background: "transparent", border: "none",
                  cursor: "pointer", justifyContent: "space-between",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <group.icon size={16} strokeWidth={2} />
                  {group.label}
                </span>
                {group.items.length > 0 && (
                  <ChevronRight
                    size={14}
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}
                  />
                )}
              </button>

              <div style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 240ms ease",
              }}>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 26, paddingTop: 2, paddingBottom: 4 }}>
                    {group.items.length === 0 && (
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: "rgba(255,255,255,0.3)", padding: "6px 10px" }}>
                        Bientôt disponible
                      </span>
                    )}
                    {group.items.map((item) =>
                      item.disabled ? (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", fontFamily: FONT, fontSize: 12.5, color: "rgba(255,255,255,0.28)" }}>
                          {item.label}
                          <span style={{ fontSize: 9.5, fontWeight: 700, background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 20 }}>Bientôt</span>
                        </div>
                      ) : (
                        <NavLink key={item.to} to={item.to} style={({ isActive }) => subRowStyle(isActive)}>
                          {item.label}
                        </NavLink>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${C.sidebarBorder}`, paddingTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "12px" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
          RK
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Rania Kabbaj</div>
          <div style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Consultante</div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", padding: 4 }} aria-label="Déconnexion" title="Déconnexion">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

const rowStyle = (isActive) => ({
  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7,
  textDecoration: "none", fontFamily: FONT, fontSize: 13.5, fontWeight: isActive ? 600 : 500,
  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
});

const subRowStyle = (isActive) => ({
  display: "block", padding: "7px 10px", borderRadius: 6,
  textDecoration: "none", fontFamily: FONT, fontSize: 12.5, fontWeight: isActive ? 600 : 500,
  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
});