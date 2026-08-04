import React from "react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from "../../styles/designSystem";

export default function KPICard({ label, value, trend, icon: Icon, tone = "neutral" }) {
  const getToneColor = () => {
    switch (tone) {
      case "success": return COLORS.success;
      case "warning": return COLORS.warning;
      case "danger": return COLORS.danger;
      case "info": return COLORS.info;
      default: return COLORS.text;
    }
  };

  const bgColor = tone === "neutral" ? COLORS.background : 
                 tone === "success" ? "#ECFDF5" :
                 tone === "warning" ? "#FFFBEB" :
                 tone === "danger" ? "#FEF2F2" :
                 tone === "info" ? "#EFF6FF" : COLORS.background;

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${COLORS.borderLight}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
      boxShadow: SHADOWS.sm,
      display: "flex",
      flexDirection: "column",
      gap: SPACING.xs,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary, fontWeight: 500 }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 32, height: 32,
            borderRadius: BORDERS.radius.md,
            background: "rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={getToneColor()} strokeWidth={2} />
          </div>
        )}
      </div>
      
      <div style={{ ...TYPOGRAPHY.h2, color: COLORS.text, margin: 0 }}>
        {value}
      </div>
      
      {trend && (
        <span style={{ ...TYPOGRAPHY.caption, color: getToneColor() }}>
          {trend}
        </span>
      )}
    </div>
  );
}
