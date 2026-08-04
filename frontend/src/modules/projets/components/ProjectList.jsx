import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Wallet, CalendarClock, Users2 } from "lucide-react";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Highlight from "../../../components/ui/Highlight";
import StatCard from "../../../components/ui/StatCard";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";
import { getWorkflowState } from "../lib/workflow";
import { isOpportunite, isProjet } from "../lib/workflow";

function initials(name) {
  if (!name) return "—";
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function ProjectList({ workflowStateFilter, statutFilter, viewMode = "table" }) {
  const navigate = useNavigate();
  const { projects, addProject, getContratsForProject } = useData();
  const [query, setQuery] = React.useState("");
  const [chefFilter, setChefFilter] = React.useState("");
  const [sort, setSort] = React.useState({ key: "nom", dir: "asc" });
  const [showForm, setShowForm] = React.useState(false);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (workflowStateFilter === "opportunite") {
      list = list.filter(isOpportunite);
    } else if (workflowStateFilter === "projet") {
      list = list.filter(isProjet);
    }
    if (statutFilter) {
      if (Array.isArray(statutFilter)) {
        list = list.filter(p => statutFilter.includes(p.statut));
      } else {
        list = list.filter(p => p.statut === statutFilter);
      }
    }
    if (query) {
      list = list.filter(p => p.nom.toLowerCase().includes(query.toLowerCase()));
    }
    if (chefFilter) {
      list = list.filter(p => p.chef === chefFilter);
    }
    return list;
  }, [projects, workflowStateFilter, statutFilter, query, chefFilter]);

  const chefs = useMemo(() => [...new Set(filteredProjects.map((p) => p.chef))].sort(), [filteredProjects]);
  const actifs = useMemo(() => filteredProjects.filter((p) => p.statut === "actif" || p.statut === "en_execution"), [filteredProjects]);
  const countActif = actifs.length;
  const countInteresse = filteredProjects.filter((p) => p.statut === "interesse").length;
  const countTermine = filteredProjects.filter((p) => p.statut === "termine").length;

  const budgetEngageTotal = actifs.reduce((sum, p) => sum + (p.budget_engage || 0), 0);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const now = new Date();
  const echeancesProches = actifs.filter((p) => p.fin && new Date(p.fin) >= now && new Date(p.fin) <= in30Days).length;

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const sortableHeader = (key, label) => (
    <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(key)}>
      {label} {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </span>
  );

  const columns = [
    { key: "nom", label: sortableHeader("nom", "Projet"), render: (r) => <Highlight text={r.nom} query={query} /> },
    { key: "client", label: sortableHeader("client", "Client") },
    { key: "lieu", label: sortableHeader("lieu", "Lieu") },
    {
      key: "chef", label: sortableHeader("chef", "Chef de projet"),
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%", background: C.accentLt, color: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            fontFamily: FONT, fontSize: 10, fontWeight: 700,
          }}>
            {initials(r.chef)}
          </div>
          {r.chef}
        </div>
      ),
    },
    { key: "fin", label: "Fin prévue", render: (r) => fmtDate(r.fin) },
    { key: "subs", label: "Sous-traitants", render: (r) => getContratsForProject(r.id).length },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  const emptyMessage = query
    ? `Aucun projet ne correspond à « ${query} »`
    : chefFilter
    ? `Aucun projet pour ${chefFilter}`
    : "Aucun projet dans cette catégorie";

  // Vue Kanban pour les opportunités
  if (viewMode === "kanban") {
    return <KanbanView projects={filteredProjects} navigate={navigate} query={query} setQuery={setQuery} />;
  }

  // Vue Table pour les projets
  return (
    <div>
      <div style={{ padding: "20px 32px", background: C.paper }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard label="Projets actifs" value={countActif} icon={FolderKanban} subtext={`${countTermine} terminés au total`} />
          <StatCard label="Budget engagé" value={fmt(budgetEngageTotal)} icon={Wallet} subtext="sur les projets actifs" />
          <StatCard
            label="Échéances 30 jours" value={echeancesProches} icon={CalendarClock}
            subtext={echeancesProches > 0 ? "livraisons à surveiller" : "aucune livraison proche"}
            tone={echeancesProches > 0 ? "warning" : "neutral"}
          />
          <StatCard label="Chefs de projet" value={chefs.length} icon={Users2} subtext="mobilisés actuellement" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, width: "300px" }}
          />

          <select
            value={chefFilter}
            onChange={(e) => setChefFilter(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}
          >
            <option value="">Tous les chefs de projet</option>
            {chefs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filteredProjects.length > 0 ? (
          <Table columns={columns} rows={filteredProjects} onRowClick={(row) => {
            const isOpp = isOpportunite(row);
            navigate(isOpp ? `/opportunites/${row.id}` : `/projets/${row.id}`);
          }} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// Sous-composant pour vue Kanban (opportunités)
function KanbanView({ projects, navigate, query, setQuery }) {
  const COLUMNS = [
    { statut: "interesse", label: "Intéressé", tone: "#6B7280" },
    { statut: "en_preparation", label: "En préparation", tone: "#C2410C" },
    { statut: "soumis", label: "Déposée", tone: "#2563EB" },
    { statut: "gagne", label: "Gagnée", tone: "#16A34A" },
    { statut: "perdu", label: "Rejetée", tone: "#DC2626" },
  ];

  const filtered = query 
    ? projects.filter(p => p.nom.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const byColumn = (statut) => {
    if (statut === "perdu") return filtered.filter((p) => p.statut === "perdu" || p.statut === "abandonne");
    return filtered.filter((p) => p.statut === statut);
  };

  return (
    <div style={{ padding: "20px 32px", background: C.paper, minHeight: "calc(100vh - 90px)" }}>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher une opportunité..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, width: "300px" }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 48, textAlign: "center" }}>
          <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>
            Aucune opportunité pour l'instant
          </p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.faint, margin: 0 }}>
            Marquez un appel d'offres comme "Intéressé" depuis le module Marchés Publics pour le voir apparaître ici.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))`, gap: 14, alignItems: "start" }}>
          {COLUMNS.map((col) => {
            const items = byColumn(col.statut);
            return (
              <div key={col.statut}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, padding: "0 2px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.tone, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: C.ink }}>{col.label}</span>
                  <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: C.faint }}>({items.length})</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
                  {items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/opportunites/${p.id}`)}
                      style={{
                        textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10,
                        padding: "12px 13px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 7,
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.nom}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint }}>
                        {p.lieu || "Lieu non précisé"}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.mute, fontWeight: 600 }}>
                        {fmt(p.budget || 0)}
                      </span>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <div style={{ border: `1px dashed ${C.line}`, borderRadius: 10, padding: "16px 10px", textAlign: "center" }}>
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint }}>Vide</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
