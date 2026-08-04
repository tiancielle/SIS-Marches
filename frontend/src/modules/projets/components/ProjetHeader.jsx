import React from "react";
import { 
  CheckCircle, Edit 
} from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS } from "../../../styles/designSystem";
import { formatMontant, fmtDate } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";

export default function ProjetHeader({ project, onEdit }) {
  const avancement = project.avancement_global || 0;

  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.xl,
      padding: `${SPACING.lg} ${SPACING.xl}`,
      marginBottom: SPACING.lg,
      boxShadow: SHADOWS.sm,
    }}>
      {/* Ligne 1: Nom + Organisme + Statut + Progression */}
      <div style={{ marginBottom: SPACING.sm }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.xs }}>
          <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.text, margin: 0, flex: 1 }}>
            {project.nom}
          </h2>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary }}>
            {project.client || project.organisme || "Non spécifié"}
          </span>
          <Badge status={project.statut} />
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.xs, minWidth: 120 }}>
            <div style={{
              height: 4,
              flex: 1,
              background: COLORS.surfaceAlt,
              borderRadius: BORDERS.radius.full,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${avancement}%`,
                background: COLORS.success,
                borderRadius: BORDERS.radius.full,
              }} />
            </div>
            <span style={{ ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: 600 }}>
              {avancement}%
            </span>
          </div>
        </div>
      </div>

      {/* Ligne 2: Budget + Chef + Modifier */}
      <div style={{ marginBottom: SPACING.sm }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.md }}>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {formatMontant(project.budget || 0)}
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {project.chef || "Non assigné"}
          </span>
          <button
            onClick={onEdit}
            style={{
              padding: `${SPACING.xs} ${SPACING.sm}`,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.background,
              color: COLORS.textSecondary,
              borderRadius: BORDERS.radius.sm,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
              ":hover": {
                background: COLORS.surface,
                color: COLORS.text,
              },
            }}
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Ligne 3: Dates + Équipe + Sous-traitants */}
      <div style={{ marginBottom: SPACING.sm }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.md }}>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {fmtDate(project.debut)} → {fmtDate(project.fin)}
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {project.equipe?.length || 0} membres
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {project.sous_traitants?.length || 0} ST
          </span>
        </div>
      </div>

      {/* Ligne 4: Contrats + Livrables + Échéance + Dernière activité */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.md }}>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {project.contrats?.length || 0} contrat
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            {project.livrables?.length || 0} livrables
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text }}>
            Échéance: {project.prochaine_echeance ? fmtDate(project.prochaine_echeance) : "Non définie"}
          </span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textMuted }}>•</span>
          <span style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
            {formatRelativeTime(project.derniere_activite)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString) {
  if (!dateString) return "Non disponible";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
