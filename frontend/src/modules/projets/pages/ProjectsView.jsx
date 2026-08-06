import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Highlight from "../../../components/ui/Highlight";
import ProjectForm from "./ProjectForm";
import { useData } from "../../../store/DataContext";
import { fmtDate } from "../../../lib/mockData";
import { COLORS, BORDERS, TYPOGRAPHY, SHADOWS } from "../../../styles/designSystem";
import { TRANSITIONS_PAR_STATUT } from "../lib/tabsConfig";

export default function ProjectsView() {
  const navigate = useNavigate();
  const { projects, addProject, changeProjectStatut, getContratsForProject } = useData();
  const [tab, setTab] = useState("actif");
  const [query, setQuery] = useState("");
  const [chefFilter, setChefFilter] = useState("");
  const [sort, setSort] = useState({ key: "nom", dir: "asc" });
  const [showForm, setShowForm] = useState(false);
  const [actionsMenu, setActionsMenu] = useState(null);

  // Filtrer uniquement les projets réels (workflow_state = "projet")
  const realProjects = useMemo(() => 
    projects.filter(p => p.workflow_state === "projet" || (p.workflow_state === undefined && p.statut === "actif")), 
    [projects]
  );

  const chefs = useMemo(() => [...new Set(realProjects.map((p) => p.chef))].sort(), [realProjects]);
  
  // Compteurs pour les onglets
  const countADemarrer = realProjects.filter((p) => p.statut === "a_demarrer").length;
  const countEnCours = realProjects.filter((p) => p.statut === "en_execution" || p.statut === "actif").length;
  const countSuspendus = realProjects.filter((p) => p.statut === "suspendu").length;
  const countTermines = realProjects.filter((p) => p.statut === "termine").length;
  const countTous = realProjects.length;

  const TABS = [
    { key: "tous", label: "Tous", count: countTous },
    { key: "a_demarrer", label: "À démarrer", count: countADemarrer },
    { key: "en_execution", label: "En exécution", count: countEnCours },
    { key: "suspendu", label: "Suspendu", count: countSuspendus },
    { key: "termine", label: "Terminé", count: countTermines },
  ];

  const rows = useMemo(() => {
    let list = realProjects;
    
    // Filtrage par onglet
    if (tab === "a_demarrer") {
      list = list.filter((p) => p.statut === "a_demarrer");
    } else if (tab === "en_execution") {
      list = list.filter((p) => p.statut === "en_execution" || p.statut === "actif");
    } else if (tab === "suspendu") {
      list = list.filter((p) => p.statut === "suspendu");
    } else if (tab === "termine") {
      list = list.filter((p) => p.statut === "termine");
    }
    // "tous" ne filtre pas par statut
    
    if (chefFilter) list = list.filter((p) => p.chef === chefFilter);
    if (query) list = list.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [realProjects, tab, query, chefFilter, sort]);

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const sortableHeader = (key, label) => (
    <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(key)}>
      {label} {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </span>
  );

  const columns = [
    { key: "nom", label: sortableHeader("nom", "Nom du marché"), render: (r) => <Highlight text={r.nom} query={query} /> },
    { key: "client", label: sortableHeader("client", "Maître d'ouvrage") },
    { key: "statut", label: sortableHeader("statut", "Phase actuelle"), render: (r) => <Badge status={r.statut} /> },
    { key: "budget", label: sortableHeader("budget", "Montant"), render: (r) => r.budget ? `${r.budget.toLocaleString()} MAD` : "—" },
    { key: "fin", label: sortableHeader("fin", "Prochaine échéance"), render: (r) => fmtDate(r.fin) },
    { key: "chef", label: sortableHeader("chef", "Chef de projet") },
    { 
      key: "actions", 
      label: "", 
      render: (r) => (
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionsMenu(actionsMenu === r.id ? null : r.id);
            }}
            style={{
              width: 28, height: 28,
              borderRadius: BORDERS.radius.sm,
              border: "none",
              background: COLORS.surface,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.textSecondary,
            }}
          >
            <MoreHorizontal size={14} strokeWidth={2} />
          </button>
          
          {actionsMenu === r.id && (
            <div 
              onMouseLeave={() => setActionsMenu(null)}
              style={{
                position: "absolute", right: 0, top: "100%",
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: BORDERS.radius.md,
                boxShadow: SHADOWS.lg,
                padding: 4,
                minWidth: 180,
                zIndex: 10,
              }}
            >
              {TRANSITIONS_PAR_STATUT[r.statut]?.map((transition) => (
                <button
                  key={transition.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeProjectStatut(r.id, transition.value);
                    setActionsMenu(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: BORDERS.radius.sm,
                    color: COLORS.text,
                    fontFamily: TYPOGRAPHY.body.fontFamily,
                    fontSize: 13,
                    textAlign: "left",
                    ":hover": {
                      background: COLORS.surfaceAlt,
                    },
                  }}
                >
                  {transition.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    },
  ];

  const emptyMessage = query
    ? `Aucun projet ne correspond à « ${query} »`
    : chefFilter
    ? `Aucun projet pour ${chefFilter}`
    : "Aucun projet dans cette catégorie";

  return (
    <div>
      <Header
        title="Projets"
        subtitle={`${countEnCours} en cours · ${countADemarrer} à démarrer · ${countSuspendus} suspendus · ${countTermines} terminés`}
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau projet"
        onAction={() => setShowForm(true)}
      />

      <div style={{ padding: "20px 32px", background: COLORS.background }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: BORDERS.radius.md, padding: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: TYPOGRAPHY.body.fontFamily, fontSize: 13.5, fontWeight: 600, padding: "7px 14px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  color: tab === t.key ? "#fff" : COLORS.textTertiary,
                  background: tab === t.key ? COLORS.accent : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                {t.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>({t.count})</span>
              </button>
            ))}
          </div>

          <select
            value={chefFilter}
            onChange={(e) => setChefFilter(e.target.value)}
            style={{ fontFamily: TYPOGRAPHY.body.fontFamily, fontSize: 13, color: COLORS.text, padding: "8px 12px", borderRadius: BORDERS.radius.md, border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: "pointer" }}
          >
            <option value="">Tous les chefs de projet</option>
            {chefs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/projets/${row.id}`)} />
        ) : (
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: BORDERS.radius.md, padding: 40, textAlign: "center", fontFamily: TYPOGRAPHY.body.fontFamily, fontSize: 13.5, color: COLORS.textTertiary }}>
            {emptyMessage}
          </div>
        )}
      </div>

      {showForm && (
        <ProjectForm onClose={() => setShowForm(false)} onSave={(data) => { addProject(data); setShowForm(false); }} />
      )}
    </div>
  );
}