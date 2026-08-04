import React from "react";
import { FileText, Download, MoreHorizontal } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../../styles/designSystem";

export default function DocumentsWidget({ documents, onViewAll }) {
  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
    }}>
      <WidgetHeader title={`Documents (${documents?.length || 0})`} onViewAll={onViewAll} />
      
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
        {documents?.slice(0, 4).map(doc => (
          <DocumentItem key={doc.id} document={doc} />
        ))}
        
        {(!documents || documents.length === 0) && (
          <div style={{ 
            padding: SPACING.lg, 
            textAlign: "center", 
            color: COLORS.textSecondary,
            ...TYPOGRAPHY.bodySmall 
          }}>
            Aucun document
          </div>
        )}
        
        {documents && documents.length > 4 && (
          <button
            onClick={onViewAll}
            style={{
              padding: SPACING.sm,
              border: `1px solid ${COLORS.borderLight}`,
              background: COLORS.background,
              color: COLORS.textSecondary,
              borderRadius: BORDERS.radius.md,
              cursor: "pointer",
              fontSize: 12,
              ":hover": {
                background: COLORS.surface,
              },
            }}
          >
            Voir tous les documents
          </button>
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

function DocumentItem({ document }) {
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
          {document.nom}
        </div>
        <div style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
          {document.auteur || "Inconnu"} • {formatDate(document.date)}
        </div>
      </div>
      <button
        style={{
          padding: SPACING.xs,
          border: "none",
          background: "transparent",
          color: COLORS.textSecondary,
          cursor: "pointer",
          ":hover": {
            color: COLORS.text,
          },
        }}
        title="Télécharger"
      >
        <Download size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
