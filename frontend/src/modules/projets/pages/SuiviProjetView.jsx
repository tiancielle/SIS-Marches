import React from "react";
import { useNavigate } from "react-router-dom";
import { C, FONT } from "../../../styles/theme";
import { fmtDate, formatMontant } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";
import { useData } from "../../../store/DataContext";
import { isProjet } from "../lib/workflow";

export default function SuiviProjetView() {
  const navigate = useNavigate();
  const { projects } = useData();

  const projets = projects.filter(isProjet);

  if (projets.length === 0) {
    return (
      <div style={{ padding: "48px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 12 }}>
          Aucun projet en cours
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, marginBottom: 24 }}>
          Les projets gagnés apparaîtront ici après conversion des opportunités.
        </p>
        <button
          onClick={() => navigate("/opportunites")}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            color: "#fff", background: C.accent, border: "none", borderRadius: 8,
            padding: "10px 20px", cursor: "pointer",
          }}
        >
          Voir les opportunités
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px clamp(20px, 4vw, 48px)" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
          Projets en cours
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, margin: 0 }}>
          {projets.length} projet(s) en exécution
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
        {projets.map((projet) => (
          <ProjetCard key={projet.id} projet={projet} onClick={() => navigate(`/projets/${projet.id}`)} />
        ))}
      </div>
    </div>
  );
}

function ProjetCard({ projet, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.target.style.borderColor = C.accent;
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = "none";
        e.target.style.borderColor = C.line;
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <Badge status={projet.statut} />
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
          {fmtDate(projet.debut)}
        </span>
      </div>

      <h3 style={{
        fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.ink,
        margin: "0 0 12px", lineHeight: 1.4,
      }}>
        {projet.nom}
      </h3>

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: "0 0 4px" }}>
          Client
        </p>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, margin: 0 }}>
          {projet.client || "Non spécifié"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, margin: "0 0 4px" }}>
            Budget
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, margin: 0 }}>
            {formatMontant(projet.budget)}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, margin: "0 0 4px" }}>
            Chef de projet
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, margin: 0 }}>
            {projet.chef || "Non assigné"}
          </p>
        </div>
      </div>

      <div style={{
        paddingTop: 12,
        borderTop: `1px solid ${C.line}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
          Échéance: {fmtDate(projet.fin)}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 600 }}>
          Voir détails →
        </span>
      </div>
    </div>
  );
}
