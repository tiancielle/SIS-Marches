// Liste compacte des projets actifs — progression calculée depuis budget engagé / budget,
// pas un simple pourcentage inventé. Avatars en initiales pour rester dans l'esprit du Sidebar
// (même traitement que l'avatar utilisateur en bas de la nav).
import React from "react";
import { useNavigate } from "react-router-dom";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";
import { fmt } from "../../../lib/mockData";

function initials(name) {
  if (!name) return "—";
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function MyProjects({ projects }) {
  const navigate = useNavigate();
  const actifs = projects.filter((p) => p.statut === "actif").slice(0, 5);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink, margin: 0 }}>
          Mes projets
        </h2>
        <button
          onClick={() => navigate("/projects")}
          style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.mute, background: "none", border: "none", cursor: "pointer" }}
        >
          Tout voir
        </button>
      </div>

      {actifs.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.faint }}>Aucun projet actif.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {actifs.map((p) => {
            const progress = p.budget ? Math.min(100, Math.round(((p.budget_engage || 0) / p.budget) * 100)) : 0;
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 6px", borderRadius: 7, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.paper)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: C.accentLt, color: C.accent,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
                }}>
                  {initials(p.chef)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.nom}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint }}>
                    {p.client} · {fmt(p.budget)}
                  </div>
                </div>

                <div style={{ width: 84, flexShrink: 0 }}>
                  <div style={{ height: 4, borderRadius: 2, background: C.line, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: C.accent, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 10.5, color: C.faint, marginTop: 3, textAlign: "right" }}>
                    {progress}% engagé
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
