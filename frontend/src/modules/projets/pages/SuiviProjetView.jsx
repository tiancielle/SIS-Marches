import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Wallet, CalendarClock, AlertCircle, Search, MoreHorizontal, PieChart, BarChart3 } from "lucide-react";
import { C, FONT } from "../../../styles/theme";
import { fmtDate, formatMontant } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";
import { useData } from "../../../store/DataContext";
import { isProjet } from "../lib/workflow";
import { TRANSITIONS_PAR_STATUT } from "../lib/tabsConfig";

export default function SuiviProjetView() {
  const navigate = useNavigate();
  const { projects, changeProjectStatut } = useData();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("actifs");
  const [actionsMenu, setActionsMenu] = useState(null);

  const projets = projects.filter(isProjet);
  const projetsActifs = projets.filter(p => p.statut !== "termine");

  // KPIs réels (uniquement projets actifs : À démarrer, En exécution, Suspendu)
  const kpiADemarrer = projetsActifs.filter(p => p.statut === "a_demarrer").length;
  const kpiEnExecution = projetsActifs.filter(p => p.statut === "en_execution" || p.statut === "actif").length;
  const kpiSuspendus = projetsActifs.filter(p => p.statut === "suspendu").length;
  const montantTotal = projetsActifs.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Échéances proches
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const echeancesProches = projetsActifs.filter(p => p.fin && new Date(p.fin) >= now && new Date(p.fin) <= in30Days).length;

  const filteredProjets = projets.filter(p => {
    const matchQuery = !query || p.nom.toLowerCase().includes(query.toLowerCase());
    
    let matchTab = true;
    if (tab === "a_demarrer") {
      matchTab = p.statut === "a_demarrer";
    } else if (tab === "en_execution") {
      matchTab = p.statut === "en_execution" || p.statut === "actif";
    } else if (tab === "suspendu") {
      matchTab = p.statut === "suspendu";
    }
    
    return matchQuery && matchTab;
  });

  const TABS = [
    { key: "actifs", label: "Projets actifs", count: kpiADemarrer + kpiEnExecution + kpiSuspendus },
    { key: "a_demarrer", label: "À démarrer", count: kpiADemarrer },
    { key: "en_execution", label: "En exécution", count: kpiEnExecution },
    { key: "suspendu", label: "Suspendus", count: kpiSuspendus },
  ];

  if (projets.length === 0) {
    return (
      <div style={{ padding: "48px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 12 }}>
          Aucun projet en cours
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, marginBottom: 24 }}>
          Les projets gagnés apparaîtront ici après conversion des opportunités.
        </p>
        <button
          onClick={() => navigate("/opportunites")}
          style={{
            fontFamily: FONT, fontSize: 14, fontWeight:  600,
            color: "#fff", background: C.accent, border: "none", borderRadius: 8,
            padding: "10px 20px", cursor: "pointer",
          }}
        >
          Voir les opportunités
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px clamp(20px, 4vw, 48px)" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
            Projets
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, margin: 0 }}>
            {projets.length} projet(s) · {kpiEnExecution} en exécution · {kpiADemarrer} à démarrer
          </p>
        </div>
      </div>

      {/* KPIs réels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KPICard 
          label="Projets en exécution" 
          value={kpiEnExecution} 
          icon={FolderKanban}
          subtext={`${kpiADemarrer} à démarrer · ${kpiSuspendus} suspendus`}
        />
        <KPICard 
          label="À démarrer" 
          value={kpiADemarrer} 
          icon={CalendarClock}
          subtext="projets gagnés en attente"
        />
        <KPICard 
          label="Montant total" 
          value={formatMontant(montantTotal)} 
          icon={Wallet}
          subtext="sur projets actifs"
        />
        <KPICard 
          label="Échéances 30 jours" 
          value={echeancesProches} 
          icon={AlertCircle}
          subtext={echeancesProches > 0 ? "à surveiller" : "aucune échéance proche"}
          tone={echeancesProches > 0 ? "warning" : "neutral"}
        />
      </div>

      {/* Graphiques avec données réelles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        <ChartCard 
          title="Répartition par statut" 
          icon={PieChart}
        >
          <StatutChart projets={projetsActifs} />
        </ChartCard>
        <ChartCard 
          title="Évolution mensuelle" 
          icon={BarChart3}
        >
          <MonthlyChart projets={projetsActifs} />
        </ChartCard>
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
            placeholder="Rechercher un projet..."
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

      {/* Liste des projets */}
      {filteredProjets.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 48, textAlign: "center", fontFamily: FONT, fontSize: 14, color: C.mute }}>
          Aucun projet dans cette catégorie
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {filteredProjets.map((projet) => (
            <ProjetCard 
              key={projet.id} 
              projet={projet} 
              onClick={() => navigate(`/projets/${projet.id}`)}
              onStatutChange={(statut) => changeProjectStatut(projet.id, statut)}
              actionsMenu={actionsMenu}
              setActionsMenu={setActionsMenu}
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

function ProjetCard({ projet, onClick, onStatutChange, actionsMenu, setActionsMenu }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = C.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = C.line;
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <Badge status={projet.statut} />
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionsMenu(actionsMenu === projet.id ? null : projet.id);
            }}
            style={{
              width: 24, height: 24,
              borderRadius: 6, border: "none",
              background: C.paper, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.mute,
            }}
          >
            <MoreHorizontal size={14} strokeWidth={2} />
          </button>
          
          {actionsMenu === projet.id && (
            <div 
              onMouseLeave={() => setActionsMenu(null)}
              style={{
                position: "absolute", right: 0, top: "100%",
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: 4,
                minWidth: 160,
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {TRANSITIONS_PAR_STATUT[projet.statut]?.map((transition) => (
                <button
                  key={transition.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatutChange(transition.value);
                    setActionsMenu(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: 4,
                    color: C.ink,
                    fontFamily: FONT, fontSize: 13,
                    textAlign: "left",
                    ":hover": {
                      background: C.paper,
                    },
                  }}
                >
                  {transition.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h3 style={{
        fontFamily: FONT, fontSize: 16, fontWeight: 600, color: C.ink,
        margin: "0 0 12px", lineHeight: 1.4,
      }}>
        {projet.nom}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, margin: "0 0 4px" }}>
          Maître d'ouvrage
        </p>
        <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, margin: 0 }}>
          {projet.client || "Non spécifié"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, margin: "0 0 4px" }}>
            Montant
          </p>
          <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: C.ink, margin: 0 }}>
            {formatMontant(projet.budget)}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 12, color: C.mute, margin: "0 0 4px" }}>
            Chef de projet
          </p>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, margin: 0 }}>
            {projet.chef || "Non assigné"}
          </p>
        </div>
      </div>

      <div style={{
        paddingTop: 16,
        borderTop: `1px solid ${C.line}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
          Échéance: {fmtDate(projet.fin)}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 600 }}>
          Voir détails →
        </span>
      </div>
    </div>
  );
}

function StatutChart({ projets }) {
  const data = projets.reduce((acc, p) => {
    const statut = p.statut || "autre";
    acc[statut] = (acc[statut] || 0) + 1;
    return acc;
  }, {});

  const labels = {
    a_demarrer: "À démarrer",
    en_execution: "En exécution",
    actif: "Actif",
    suspendu: "Suspendu",
    autre: "Autre"
  };

  const total = projets.length;
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {entries.map(([key, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink }}>
                {labels[key] || key}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink }}>
                {count} ({percentage}%)
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.line, overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${percentage}%`, 
                  height: "100%", 
                  background: C.accent, 
                  borderRadius: 4 
                }} 
              />
            </div>
          </div>
        );
      })}
      {entries.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute, textAlign: "center", padding: 20 }}>
          Aucune donnée
        </div>
      )}
    </div>
  );
}

function MonthlyChart({ projets }) {
  const now = new Date();
  const months = [];
  
  // Générer les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    months.push({ key, label });
  }

  const data = projets.reduce((acc, p) => {
    if (p.debut) {
      const date = new Date(p.debut);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});

  const maxValue = Math.max(...months.map(m => data[m.key] || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120 }}>
        {months.map(({ key, label }) => {
          const count = data[key] || 0;
          const barHeight = (count / maxValue) * 100;
          return (
            <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ 
                width: "100%", 
                height: `${barHeight}%`, 
                background: count > 0 ? C.accent : C.line, 
                borderRadius: 4,
                minHeight: 4,
              }} />
              <span style={{ fontFamily: FONT, fontSize: 11, color: C.mute }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {projets.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute, textAlign: "center", padding: 20 }}>
          Aucune donnée
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Icon size={18} color={C.accent} />
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.ink }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
