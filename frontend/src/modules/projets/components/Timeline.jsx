import React from "react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../styles/designSystem";
import { 
  Calendar, CheckCircle, AlertCircle, FileText, Users, Briefcase, 
  Gavel, DollarSign, Plus, X, Edit, Send, 
} from "lucide-react";

const EVENT_ICONS = {
  creation: CheckCircle,
  statut_change: Calendar,
  equipe_affectee: Users,
  contrat_signe: Gavel,
  contrat_cree: FileText,
  livrable_envoye: FileText,
  paiement_ajoute: DollarSign,
  analyse_ia: Briefcase,
  document_ajoute: FileText,
  ignore: X,
  reactiver: Plus,
  modification: Edit,
  depot: Send,
  default: Calendar,
};

const EVENT_COLORS = {
  creation: COLORS.success,
  statut_change: COLORS.primary,
  equipe_affectee: "#3B82F6",
  contrat_signe: COLORS.success,
  contrat_cree: "#F59E0B",
  livrable_envoye: COLORS.success,
  paiement_ajoute: "#10B981",
  analyse_ia: "#8B5CF6",
  document_ajoute: COLORS.textTertiary,
  ignore: COLORS.textMuted,
  reactiver: COLORS.success,
  modification: COLORS.warning,
  depot: COLORS.info,
  default: COLORS.textTertiary,
};

export default function Timeline({ events = [], entityType = "projet" }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ 
        padding: SPACING.xl, 
        textAlign: "center", 
        color: COLORS.textSecondary,
        ...TYPOGRAPHY.body 
      }}>
        Aucun événement pour le moment
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
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
    
    return formatDate(dateString);
  };

  return (
    <div style={{ padding: SPACING.lg }}>
      <div style={{ position: "relative" }}>
        {/* Ligne verticale */}
        <div style={{
          position: "absolute", left: 16, top: 0, bottom: 0,
          width: 2, background: COLORS.borderLight,
        }} />

        {events.map((event, index) => {
          const IconComponent = EVENT_ICONS[event.type_evenement] || EVENT_ICONS.default;
          const iconColor = EVENT_COLORS[event.type_evenement] || EVENT_COLORS.default;
          
          return (
            <div key={event.id || index} style={{ position: "relative", marginBottom: SPACING.lg, paddingLeft: SPACING.xl }}>
              {/* Point sur la ligne */}
              <div style={{
                position: "absolute", left: 7, top: 4,
                width: 20, height: 20, borderRadius: "50%",
                background: COLORS.background,
                border: `2px solid ${iconColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1,
                boxShadow: "0 0 0 4px rgba(0,0,0,0.1)",
              }}>
                <IconComponent size={10} color={iconColor} strokeWidth={2.5} />
              </div>

              {/* Contenu de l'événement */}
              <div style={{ 
                background: COLORS.background, 
                border: `1px solid ${COLORS.borderLight}`, 
                borderRadius: BORDERS.radius.lg, 
                padding: SPACING.lg,
                transition: "box-shadow 0.2s ease",
                ":hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SPACING.sm }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: 600, marginBottom: SPACING.xs }}>
                      {event.titre}
                    </div>
                    {event.description && (
                      <div style={{ ...TYPOGRAPHY.small, color: COLORS.textSecondary }}>
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: SPACING.md }}>
                    <div style={{ ...TYPOGRAPHY.caption, color: COLORS.text, fontWeight: 600 }}>
                      {formatRelativeTime(event.date_creation)}
                    </div>
                  </div>
                </div>

                {event.utilisateur_nom && (
                  <div style={{ ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: SPACING.xs }}>
                    Par {event.utilisateur_nom}
                  </div>
                )}

                {event.donnees_changees && (
                  <div style={{
                    marginTop: SPACING.md,
                    padding: SPACING.md,
                    background: COLORS.surface,
                    borderRadius: BORDERS.radius.md,
                    fontSize: 11,
                    color: COLORS.textSecondary,
                    fontFamily: "monospace",
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: SPACING.xs }}>Changements :</div>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {JSON.stringify(event.donnees_changees, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
