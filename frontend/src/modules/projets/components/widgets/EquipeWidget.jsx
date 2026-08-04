import React from "react";
import { Users, MoreHorizontal } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../../styles/designSystem";

export default function EquipeWidget({ equipe, onViewAll }) {
  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
    }}>
      <WidgetHeader title={`Équipe (${equipe?.length || 0})`} onViewAll={onViewAll} />
      
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
        {equipe?.map(member => (
          <MemberItem key={member.id} member={member} />
        ))}
        
        {(!equipe || equipe.length === 0) && (
          <div style={{ 
            padding: SPACING.lg, 
            textAlign: "center", 
            color: COLORS.textSecondary,
            ...TYPOGRAPHY.bodySmall 
          }}>
            Aucun membre assigné
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
          Gérer →
        </button>
      )}
    </div>
  );
}

function MemberItem({ member }) {
  const initials = member.nom?.split(" ").map(n => n[0]).join("").toUpperCase() || "??";
  
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      background: COLORS.surface,
      borderRadius: BORDERS.radius.md,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: COLORS.primaryLight,
        color: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: 500 }}>
          {member.nom}
        </div>
        <div style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
          {member.intitule || member.role}
        </div>
      </div>
      <div style={{
        padding: `${SPACING.xs} ${SPACING.sm}`,
        borderRadius: BORDERS.radius.sm,
        background: member.disponibilite === "active" ? COLORS.success + "20" : COLORS.warning + "20",
        color: member.disponibilite === "active" ? COLORS.success : COLORS.warning,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
      }}>
        {member.disponibilite || "Active"}
      </div>
    </div>
  );
}
