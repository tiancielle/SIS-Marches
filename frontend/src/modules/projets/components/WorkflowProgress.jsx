import React from "react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../styles/designSystem";

export default function WorkflowProgress({ currentStep = "execution" }) {
  const steps = [
    { id: "ao", label: "AO" },
    { id: "preparation", label: "Préparation" },
    { id: "depot", label: "Dépôt" },
    { id: "attribue", label: "Attribué" },
    { id: "execution", label: "Exécution" },
    { id: "cloture", label: "Clôture" },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: `${SPACING.md} ${SPACING.xl}`,
      marginBottom: SPACING.lg,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              <Step
                label={step.label}
                status={isCompleted ? "completed" : isCurrent ? "current" : "pending"}
              />
              {index < steps.length - 1 && (
                <Connector isCompleted={isCompleted} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Step({ label, status }) {
  const getStatusStyle = () => {
    switch (status) {
      case "completed":
        return {
          color: COLORS.success,
          background: COLORS.successLight,
          icon: "✔",
        };
      case "current":
        return {
          color: COLORS.text,
          background: COLORS.primaryLight,
          icon: "███",
        };
      case "pending":
        return {
          color: COLORS.textTertiary,
          background: COLORS.surface,
          icon: "",
        };
      default:
        return {
          color: COLORS.textTertiary,
          background: COLORS.surface,
          icon: "",
        };
    }
  };

  const style = getStatusStyle();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: SPACING.xs }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: style.background,
        color: style.color,
        fontSize: 10,
        fontWeight: 600,
      }}>
        {style.icon}
      </div>
      <span style={{
        ...TYPOGRAPHY.caption,
        color: style.color,
        fontWeight: status === "current" ? 600 : 400,
      }}>
        {label}
      </span>
    </div>
  );
}

function Connector({ isCompleted }) {
  return (
    <div style={{
      flex: 1,
      height: 2,
      background: isCompleted ? COLORS.success : COLORS.borderLight,
      borderRadius: BORDERS.radius.full,
    }} />
  );
}
