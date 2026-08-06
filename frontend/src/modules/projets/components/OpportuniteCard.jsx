import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal
} from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS, TRANSITIONS } from "../../../styles/designSystem";
import { fmtDate, formatMontant } from "../../../lib/mockData";
import { useData } from "../../../store/DataContext";

export default function OpportuniteCard({ opportunite }) {
  const navigate = useNavigate();
  const { changeProjectStatut } = useData();
  const [showActions, setShowActions] = React.useState(false);

  const handleStatutChange = async (action) => {
    try {
      await changeProjectStatut(opportunite.id, action);
      setShowActions(false);
      
      // Si gagné, rediriger vers projets
      if (action === "gagne") {
        navigate("/projets");
      }
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  return (
    <div
      style={{
        background: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: BORDERS.radius.lg,
        padding: SPACING.lg,
        boxShadow: SHADOWS.sm,
        cursor: "pointer",
        transition: `box-shadow ${TRANSITIONS.normal}, border-color ${TRANSITIONS.normal}`,
        minHeight: 120,
        position: "relative",
      }}
      onClick={() => navigate(`/opportunites/${opportunite.id}`)}
      title={opportunite.nom}
    >
      {/* Header avec titre et menu */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: SPACING.md }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: SPACING.sm }}>
          <h3 style={{ 
            ...TYPOGRAPHY.h4, 
            color: COLORS.text, 
            margin: 0, 
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            lineHeight: 1.4,
            fontSize: 13,
          }}>
            {opportunite.nom}
          </h3>
        </div>
        
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            style={{
              width: 24, height: 24,
              borderRadius: BORDERS.radius.sm,
              border: "none",
              background: COLORS.surface,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.textSecondary,
            }}
          >
            <MoreHorizontal size={14} strokeWidth={2} />
          </button>
          
          {showActions && (
            <div style={{
              position: "absolute", right: 0, top: "100%",
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: BORDERS.radius.md,
              boxShadow: SHADOWS.lg,
              padding: SPACING.xs,
              minWidth: 160,
              zIndex: 10,
            }}>
              <ActionButton label="Ouvrir" onClick={() => navigate(`/opportunites/${opportunite.id}`)} />
              <ActionButton label="Déposer" onClick={() => handleStatutChange("soumis")} />
              <ActionButton label="Marquer gagnée" onClick={() => handleStatutChange("gagne")} />
              <ActionButton label="Marquer perdue" onClick={() => handleStatutChange("perdu")} />
              <ActionButton label="Archiver" onClick={() => handleStatutChange("ignore")} tone="danger" />
            </div>
          )}
        </div>
      </div>

      {/* Meta information compacte */}
      <div style={{ marginBottom: SPACING.md }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm, flexWrap: "wrap" }}>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, fontWeight: 500 }}>
            {opportunite.organisme || "Organisme non spécifié"}
          </span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textTertiary }}>
            •
          </span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {formatMontant(opportunite.budget || opportunite.montant_estimatif || 0)}
          </span>
        </div>
      </div>

      {/* Footer avec date et responsable */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
        <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
          {fmtDate(opportunite.date_limite_ao || opportunite.fin)}
        </span>
        <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textTertiary }}>
          •
        </span>
        <span style={{ ...TYPOGRAPHY.caption, color: COLORS.text }}>
          {opportunite.chef || "Non assigné"}
        </span>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, tone = "neutral" }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: SPACING.sm,
        padding: `${SPACING.xs} ${SPACING.sm}`,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        borderRadius: BORDERS.radius.sm,
        color: tone === "danger" ? COLORS.danger : COLORS.text,
        fontFamily: "inherit",
        fontSize: 12,
        textAlign: "left",
        fontWeight: 400,
        ":hover": {
          background: COLORS.surfaceAlt,
        },
      }}
    >
      {label}
    </button>
  );
}
