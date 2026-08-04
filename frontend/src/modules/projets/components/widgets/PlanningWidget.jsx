import React from "react";
import { CheckCircle, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../../styles/designSystem";
import { fmtDate } from "../../../../lib/mockData";

export default function PlanningWidget({ planning, onViewAll }) {
  const sortedJalons = planning?.jalons?.sort((a, b) => new Date(a.date_prevue) - new Date(b.date_prevue)) || [];

  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
    }}>
      <WidgetHeader title="Planning" onViewAll={onViewAll} />
      
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
        {sortedJalons.map(jalon => (
          <JalonItem key={jalon.id} jalon={jalon} />
        ))}
        
        {sortedJalons.length === 0 && (
          <div style={{ 
            padding: SPACING.lg, 
            textAlign: "center", 
            color: COLORS.textSecondary,
            ...TYPOGRAPHY.bodySmall 
          }}>
            Aucun jalon défini
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

function JalonItem({ jalon }) {
  const getStatusIcon = () => {
    switch (jalon.statut) {
      case "completed": return CheckCircle;
      case "in_progress": return Clock;
      case "delayed": return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = () => {
    switch (jalon.statut) {
      case "completed": return COLORS.success;
      case "in_progress": return COLORS.info;
      case "delayed": return COLORS.warning;
      default: return COLORS.textTertiary;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      background: COLORS.surface,
      borderRadius: BORDERS.radius.md,
    }}>
      <StatusIcon size={14} color={getStatusColor()} strokeWidth={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: 500 }}>
          {jalon.nom}
        </div>
        <div style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
          {fmtDate(jalon.date_prevue)}
        </div>
      </div>
      <div style={{
        padding: `${SPACING.xs} ${SPACING.sm}`,
        borderRadius: BORDERS.radius.sm,
        background: getStatusColor() + "20",
        color: getStatusColor(),
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
      }}>
        {jalon.statut}
      </div>
    </div>
  );
}
