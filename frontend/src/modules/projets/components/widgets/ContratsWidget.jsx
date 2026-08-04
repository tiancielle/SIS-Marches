import React from "react";
import { FileText, MoreHorizontal, ExternalLink } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../../styles/designSystem";
import { fmt } from "../../../../lib/mockData";

export default function ContratsWidget({ contrats, onViewAll }) {
  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
    }}>
      <WidgetHeader title={`Contrats (${contrats?.length || 0})`} onViewAll={onViewAll} />
      
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
        {contrats?.map(contrat => (
          <ContratItem key={contrat.id} contrat={contrat} />
        ))}
        
        {(!contrats || contrats.length === 0) && (
          <div style={{ 
            padding: SPACING.lg, 
            textAlign: "center", 
            color: COLORS.textSecondary,
            ...TYPOGRAPHY.bodySmall 
          }}>
            Aucun contrat
          </div>
        )}
      </div>
    </div>
  );
}

function WidgetHeader({ title, onViewAll }) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      marginBottom: SPACING.md 
    }}>
      <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.text, margin: 0 }}>
        {title}
      </h3>
      {onViewAll && (
        <button
          onClick={onViewAll}
          style={{
            background: "none",
            border: "none",
            color: COLORS.accent,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 500,
            ":hover": {
              textDecoration: "underline",
            },
          }}
        >
          Voir tout →
        </button>
      )}
    </div>
  );
}

function ContratItem({ contrat }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      background: COLORS.surface,
      borderRadius: BORDERS.radius.md,
    }}>
      <FileText size={14} color={COLORS.textTertiary} strokeWidth={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: 500 }}>
          {contrat.reference || "Sans référence"}
        </div>
        <div style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
          {contrat.sous_traitant_nom || "Sous-traitant inconnu"}
        </div>
      </div>
      <div style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: 600 }}>
        {fmt(contrat.montant || 0)}
      </div>
      <button
        style={{
          padding: `${SPACING.xs} ${SPACING.sm}`,
          border: `1px solid ${COLORS.borderLight}`,
          background: COLORS.background,
          color: COLORS.textSecondary,
          borderRadius: BORDERS.radius.sm,
          cursor: "pointer",
          fontSize: 11,
          ":hover": {
            background: COLORS.surface,
            color: COLORS.text,
          },
        }}
      >
        <ExternalLink size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
