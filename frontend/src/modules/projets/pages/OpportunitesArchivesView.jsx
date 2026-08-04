import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Search, FolderOpen, CheckCircle } from "lucide-react";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from "../../../styles/designSystem";
import { useData } from "../../../store/DataContext";
import Badge from "../../../components/ui/Badge";
import { isProjet } from "../lib/workflow";

export default function OpportunitesArchivesView() {
  const navigate = useNavigate();
  const { projects, changeProjectStatut } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("all");

  // Opportunités archivées (workflow_state = "archive")
  const opportunitesArchivees = projects.filter(p => 
    p.workflow_state === "archive" || (p.workflow_state === undefined && ["ignore", "perdu", "abandonne"].includes(p.statut))
  );

  // Projets terminés (workflow_state = "projet" avec statut "termine")
  const projetsTermines = projects.filter(p => 
    (p.workflow_state === "projet" || p.workflow_state === undefined) && p.statut === "termine"
  );

  const allArchives = [
    ...opportunitesArchivees.map(p => ({ ...p, type: "opportunite" })),
    ...projetsTermines.map(p => ({ ...p, type: "projet" })),
  ];

  const filtered = allArchives.filter(p => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatut = statutFilter === "all" ||
                      (statutFilter === "ignore" && p.statut === "ignore") ||
                      (statutFilter === "rejete" && ["perdu", "abandonne"].includes(p.statut)) ||
                      (statutFilter === "termine" && p.statut === "termine");
    return matchSearch && matchType && matchStatut;
  });

  const handleReactiver = async (id, type) => {
    if (type === "opportunite") {
      await changeProjectStatut(id, "interesse");
    } else {
      // Pour les projets terminés, on pourrait permettre de réactiver
      console.log("Réactiver projet terminé:", id);
    }
  };

  const handleSupprimer = async (id) => {
    // À implémenter avec l'API
    console.log("Supprimer définitivement:", id);
  };

  return (
    <div>
      <div style={{ padding: `${SPACING.xl} ${SPACING.xxl}` }}>
        <div style={{ marginBottom: SPACING.lg }}>
          <h1 style={{ ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: SPACING.sm }}>
            Archives
          </h1>
          <p style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary }}>
            {allArchives.length} dossier{allArchives.length > 1 ? "s" : ""} archivé{allArchives.length > 1 ? "s" : ""}
            {" • "}
            {opportunitesArchivees.length} opportunité{opportunitesArchivees.length > 1 ? "s" : ""}
            {" • "}
            {projetsTermines.length} projet{projetsTermines.length > 1 ? "s" : ""} terminé{projetsTermines.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Filtres */}
        <div style={{
          display: "flex",
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
            <Search
              size={16}
              color={COLORS.textTertiary}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)"
              }}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: `${SPACING.sm} ${SPACING.sm} ${SPACING.sm} 40px`,
                border: `1px solid ${COLORS.border}`,
                borderRadius: BORDERS.radius.md,
                background: COLORS.background,
                fontFamily: "inherit",
                fontSize: 13,
                color: COLORS.text,
              }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              border: `1px solid ${COLORS.border}`,
              borderRadius: BORDERS.radius.md,
              background: COLORS.background,
              fontFamily: "inherit",
              fontSize: 13,
              color: COLORS.text,
              cursor: "pointer",
              minWidth: 160,
            }}
          >
            <option value="all">Tous les types</option>
            <option value="opportunite">Opportunités</option>
            <option value="projet">Projets terminés</option>
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              border: `1px solid ${COLORS.border}`,
              borderRadius: BORDERS.radius.md,
              background: COLORS.background,
              fontFamily: "inherit",
              fontSize: 13,
              color: COLORS.text,
              cursor: "pointer",
              minWidth: 160,
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="ignore">Ignoré</option>
            <option value="rejete">Rejeté</option>
            <option value="termine">Terminé</option>
          </select>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{
            background: COLORS.background,
            border: `1px solid ${COLORS.border}`,
            borderRadius: BORDERS.radius.lg,
            padding: `${SPACING.xxxl} ${SPACING.xl}`,
            textAlign: "center",
          }}>
            <X size={48} color={COLORS.textMuted} strokeWidth={1.5} />
            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm }}>
              Aucun dossier archivé
            </h3>
            <p style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary }}>
              Les dossiers ignorés, rejetés ou terminés apparaîtront ici
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: SPACING.lg,
          }}>
            {filtered.map(item => (
              <ArchivedCard
                key={item.id}
                item={item}
                onReactiver={() => handleReactiver(item.id, item.type)}
                onSupprimer={() => handleSupprimer(item.id)}
                onOpen={() => navigate(item.type === "projet" ? `/projets/${item.id}` : `/opportunites/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArchivedCard({ item, onReactiver, onSupprimer, onOpen }) {
  const isProjet = item.type === "projet";
  const TypeIcon = isProjet ? CheckCircle : FolderOpen;
  const typeLabel = isProjet ? "Projet terminé" : "Opportunité archivée";

  return (
    <div style={{
      background: COLORS.background,
      border: `1px solid ${COLORS.border}`,
      borderRadius: BORDERS.radius.lg,
      padding: SPACING.lg,
      opacity: 0.7,
    }}>
      <div style={{ marginBottom: SPACING.md }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.xs }}>
          <TypeIcon size={14} color={COLORS.textSecondary} />
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary }}>
            {typeLabel}
          </span>
          <Badge status={item.statut} />
        </div>
        <h3 style={{ ...TYPOGRAPHY.h4, color: COLORS.text, margin: 0 }}>
          {item.nom}
        </h3>
      </div>

      <div style={{ marginBottom: SPACING.md }}>
        <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary }}>
          {item.client || item.organisme || "Non spécifié"}
        </span>
      </div>

      {isProjet && item.budget && (
        <div style={{ marginBottom: SPACING.md }}>
          <span style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary }}>
            Budget: {item.budget} DH
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: SPACING.sm, marginTop: SPACING.md }}>
        {!isProjet && (
          <button
            onClick={onReactiver}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: SPACING.xs,
              padding: `${SPACING.sm} ${SPACING.md}`,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.background,
              color: COLORS.text,
              borderRadius: BORDERS.radius.md,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              ":hover": {
                background: COLORS.surface,
              },
            }}
          >
            <Plus size={14} strokeWidth={2} />
            Réactiver
          </button>
        )}
        <button
          onClick={onOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING.xs,
            padding: `${SPACING.sm} ${SPACING.md}`,
            border: "none",
            background: COLORS.primary,
            color: "#FFFFFF",
            borderRadius: BORDERS.radius.md,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Ouvrir
        </button>
      </div>
    </div>
  );
}
