import React, { useState } from "react";
import Header from "../../../components/layout/Header";
import OpportuniteKPIs from "../components/OpportuniteKPIs";
import OpportuniteCard from "../components/OpportuniteCard";
import { useData } from "../../../store/DataContext";
import { isOpportunite } from "../lib/workflow";
import { COLORS, TYPOGRAPHY, SPACING, BORDERS, TRANSITIONS } from "../../../styles/designSystem";
import { Search, Briefcase } from "lucide-react";

export default function OpportunitesView() {
  const { projects, changeProjectStatut } = useData();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");

  // Filtrer uniquement les opportunités (workflow_state = "opportunite")
  const opportunites = projects.filter(p => p.workflow_state === "opportunite" || (p.workflow_state === undefined && isOpportunite(p)));

  const filteredOpportunites = opportunites.filter(o => {
    const matchSearch = !search || o.nom.toLowerCase().includes(search.toLowerCase());
    
    let matchStatut = true;
    if (statutFilter === "all") {
      matchStatut = true;
    } else if (statutFilter === "urgent") {
      // Urgent : date limite dans les 7 jours
      const dateLimite = new Date(o.date_limite_ao || o.fin);
      const now = new Date();
      const daysUntil = Math.ceil((dateLimite - now) / (1000 * 60 * 60 * 24));
      matchStatut = daysUntil >= 0 && daysUntil <= 7;
    } else {
      matchStatut = o.statut === statutFilter;
    }
    
    return matchSearch && matchStatut;
  });

  const FILTER_OPTIONS = [
    { value: "all", label: "Toutes" },
    { value: "interesse", label: "Intéressées" },
    { value: "en_preparation", label: "En préparation" },
    { value: "pret_a_deposer", label: "Prêtes à déposer" },
    { value: "soumis", label: "Déposées" },
    { value: "urgent", label: "Urgentes" },
  ];

  return (
    <div>
      <Header
        title="Opportunités d'affaires"
        subtitle={`${opportunites.length} opportunité${opportunites.length > 1 ? "s" : ""} en cours`}
      />

      <div style={{ padding: `${SPACING.xl} ${SPACING.xxl}`, background: COLORS.surface }}>
        {/* KPIs Dashboard */}
        <OpportuniteKPIs opportunites={opportunites} />

        {/* Barre de filtres */}
        <div style={{
          display: "flex",
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          {/* Recherche */}
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
              placeholder="Rechercher une opportunité..."
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
                ":focus": {
                  outline: "none",
                  borderColor: COLORS.accent,
                  boxShadow: `0 0 0 2px ${COLORS.primaryLight}`,
                },
              }}
            />
          </div>

          {/* Filtres Pills */}
          <div style={{ display: "flex", gap: SPACING.sm, flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatutFilter(opt.value)}
                style={{
                  padding: `${SPACING.xs} ${SPACING.md}`,
                  border: statutFilter === opt.value 
                    ? `1px solid ${COLORS.accent}` 
                    : `1px solid ${COLORS.border}`,
                  borderRadius: BORDERS.radius.full,
                  background: statutFilter === opt.value 
                    ? COLORS.accentLight 
                    : COLORS.background,
                  color: statutFilter === opt.value 
                    ? COLORS.accent 
                    : COLORS.textSecondary,
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: statutFilter === opt.value ? 600 : 400,
                  cursor: "pointer",
                  transition: `all ${TRANSITIONS.fast}`,
                  ":hover": {
                    background: statutFilter === opt.value 
                      ? COLORS.accentLight 
                      : COLORS.surfaceAlt,
                    borderColor: statutFilter === opt.value 
                      ? COLORS.accent 
                      : COLORS.border,
                  },
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des opportunités */}
        {filteredOpportunites.length === 0 ? (
          <div style={{
            background: COLORS.background,
            border: `1px solid ${COLORS.border}`,
            borderRadius: BORDERS.radius.lg,
            padding: `${SPACING.xxxl} ${SPACING.xl}`,
            textAlign: "center",
          }}>
            <div style={{ marginBottom: SPACING.md }}>
              <Briefcase size={48} color={COLORS.textMuted} strokeWidth={1.5} />
            </div>
            <h3 style={{ ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm }}>
              Aucune opportunité trouvée
            </h3>
            <p style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary }}>
              {search ? "Aucun résultat pour votre recherche" : "Commencez par marquer des appels d'offres comme intéressés"}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: SPACING.lg,
          }}>
            {filteredOpportunites.map(opportunite => (
              <OpportuniteCard
                key={opportunite.id}
                opportunite={opportunite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
