import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Search, AlertCircle, CalendarClock, TrendingUp, Wallet } from "lucide-react";
import { C, FONT } from "../../../styles/theme";
import { fmtDate, formatMontant } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";
import { useData } from "../../../store/DataContext";
import { isOpportunite } from "../lib/workflow";
import { TRANSITIONS_PAR_STATUT } from "../lib/tabsConfig";
import OpportuniteCard from "../components/OpportuniteCard";

export default function OpportunitesView() {
  const navigate = useNavigate();
  const { projects, changeProjectStatut } = useData();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("actifs");

  const opportunites = projects.filter(p => p.workflow_state === "opportunite" || (p.workflow_state === undefined && isOpportunite(p)));

  // KPIs réels
  const kpiInteresse = opportunites.filter(p => p.statut === "interesse").length;
  const kpiEnPreparation = opportunites.filter(p => p.statut === "en_preparation").length;
  const kpiPretADeposer = opportunites.filter(p => p.statut === "pret_a_deposer").length;
  const kpiSoumis = opportunites.filter(p => p.statut === "soumis").length;
  const montantTotal = opportunites.reduce((sum, p) => sum + (p.budget || p.montant_estimatif || 0), 0);
  
  // Urgences
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const urgentes = opportunites.filter(p => {
    const dateLimite = new Date(p.date_limite_ao || p.fin);
    return dateLimite >= now && dateLimite <= in7Days;
  }).length;

  const filteredOpportunites = opportunites.filter(o => {
    const matchQuery = !query || o.nom.toLowerCase().includes(query.toLowerCase());
    
    let matchTab = true;
    if (tab === "interesse") {
      matchTab = o.statut === "interesse";
    } else if (tab === "en_preparation") {
      matchTab = o.statut === "en_preparation";
    } else if (tab === "pret_a_deposer") {
      matchTab = o.statut === "pret_a_deposer";
    } else if (tab === "soumis") {
      matchTab = o.statut === "soumis";
    }
    
    return matchQuery && matchTab;
  });

  const TABS = [
    { key: "actifs", label: "Actives", count: kpiInteresse + kpiEnPreparation + kpiPretADeposer + kpiSoumis },
    { key: "interesse", label: "Intéressées", count: kpiInteresse },
    { key: "en_preparation", label: "En préparation", count: kpiEnPreparation },
    { key: "pret_a_deposer", label: "Prêtes à déposer", count: kpiPretADeposer },
    { key: "soumis", label: "Déposées", count: kpiSoumis },
  ];

  if (opportunites.length === 0) {
    return (
      <div style={{ padding: "48px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 12 }}>
          Aucune opportunité
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, marginBottom: 24 }}>
          Marquez des appels d'offres comme intéressés pour commencer.
        </p>
        <button
          onClick={() => navigate("/marches")}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            color: "#fff", background: C.accent, border: "none", borderRadius: 8,
            padding: "10px 20px", cursor: "pointer",
          }}
        >
          Voir les marchés publics
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px clamp(20px, 4vw, 48px)" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
            Opportunités
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, margin: 0 }}>
            {opportunites.length} opportunité(s) · {kpiSoumis} déposées · {urgentes} urgentes
          </p>
        </div>
      </div>

      {/* KPIs réels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KPICard 
          label="Opportunités actives" 
          value={kpiInteresse + kpiEnPreparation + kpiPretADeposer} 
          icon={Briefcase}
          subtext={`${kpiSoumis} déposées au total`}
        />
        <KPICard 
          label="En préparation" 
          value={kpiEnPreparation} 
          icon={TrendingUp}
          subtext="dossiers en cours"
        />
        <KPICard 
          label="Montant total" 
          value={formatMontant(montantTotal)} 
          icon={Wallet}
          subtext="sur toutes les opportunités"
        />
        <KPICard 
          label="Urgentes (7 jours)" 
          value={urgentes} 
          icon={AlertCircle}
          subtext={urgentes > 0 ? "échéances proches" : "aucune urgence"}
          tone={urgentes > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* Filtres et recherche */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "7px 14px",
                borderRadius: 6, border: "none", cursor: "pointer",
                color: tab === t.key ? "#fff" : C.mute,
                background: tab === t.key ? C.accent : "transparent",
                transition: "background 0.15s ease",
              }}
            >
              {t.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>({t.count})</span>
            </button>
          ))}
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
          <Search 
            size={16} 
            color={C.mute} 
            style={{ 
              position: "absolute", left: 12, top: "50%", 
              transform: "translateY(-50%)" 
            }} 
          />
          <input
            type="text"
            placeholder="Rechercher une opportunité..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              borderRadius: 8, border: `1px solid ${C.line}`,
              background: C.card,
              fontFamily: FONT, fontSize: 14, color: C.ink,
            }}
          />
        </div>
      </div>

      {/* Liste des opportunités */}
      {filteredOpportunites.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 48, textAlign: "center", fontFamily: FONT, fontSize: 14, color: C.mute }}>
          Aucune opportunité dans cette catégorie
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filteredOpportunites.map(opportunite => (
            <OpportuniteCard
              key={opportunite.id}
              opportunite={opportunite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, subtext, tone = "neutral" }) {
  const IconComponent = Icon;
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconComponent size={20} color={tone === "warning" ? C.danger : C.accent} />
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.ink }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12, color: C.faint }}>
        {subtext}
      </div>
    </div>
  );
}
