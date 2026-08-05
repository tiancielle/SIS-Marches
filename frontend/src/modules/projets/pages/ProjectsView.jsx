import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Wallet, CalendarClock, Users2 } from "lucide-react";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Highlight from "../../../components/ui/Highlight";
import StatCard from "../../../components/ui/StatCard";
import ProjectForm from "./ProjectForm";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";

function initials(name) {
  if (!name) return "—";
  return name.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function ProjectsView() {
  const navigate = useNavigate();
  const { projects, addProject, getContratsForProject } = useData();
  const [tab, setTab] = useState("actif");
  const [query, setQuery] = useState("");
  const [chefFilter, setChefFilter] = useState("");
  const [sort, setSort] = useState({ key: "nom", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

  // Filtrer uniquement les projets réels (workflow_state = "projet")
  const realProjects = useMemo(() => 
    projects.filter(p => p.workflow_state === "projet" || (p.workflow_state === undefined && p.statut === "actif")), 
    [projects]
  );

  const chefs = useMemo(() => [...new Set(realProjects.map((p) => p.chef))].sort(), [realProjects]);
  
  // Compteurs pour les nouveaux onglets
  const countADemarrer = realProjects.filter((p) => p.statut === "a_demarrer").length;
  const countEnCours = realProjects.filter((p) => p.statut === "en_execution" || p.statut === "actif").length;
  const countSuspendus = realProjects.filter((p) => p.statut === "suspendu").length;
  const countTermines = realProjects.filter((p) => p.statut === "termine").length;
  const countTous = realProjects.length;

  // KPI dérivés du même state que la liste — aucune nouvelle donnée, juste une vue résumée
  // pour retrouver l'esprit "cockpit" du Dashboard plutôt qu'une simple table brute.
  const enCoursProjects = realProjects.filter((p) => p.statut === "en_execution" || p.statut === "actif");
  const budgetEngageTotal = enCoursProjects.reduce((sum, p) => sum + (p.budget_engage || 0), 0);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const now = new Date();
  const echeancesProches = enCoursProjects.filter((p) => p.fin && new Date(p.fin) >= now && new Date(p.fin) <= in30Days).length;

  const TABS = [
    { key: "tous", label: "Tous", count: countTous },
    { key: "a_demarrer", label: "À démarrer", count: countADemarrer },
    { key: "en_cours", label: "En cours", count: countEnCours },
    { key: "suspendus", label: "Suspendus", count: countSuspendus },
    { key: "termines", label: "Terminés", count: countTermines },
  ];

  const rows = useMemo(() => {
    let list = realProjects;
    
    // Filtrage par onglet
    if (tab === "a_demarrer") {
      list = list.filter((p) => p.statut === "a_demarrer");
    } else if (tab === "en_cours") {
      list = list.filter((p) => p.statut === "en_execution" || p.statut === "actif");
    } else if (tab === "suspendus") {
      list = list.filter((p) => p.statut === "suspendu");
    } else if (tab === "termines") {
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
    { key: "nom", label: sortableHeader("nom", "Projet"), render: (r) => <Highlight text={r.nom} query={query} /> },
    { key: "client", label: sortableHeader("client", "Client") },
    { key: "lieu", label: sortableHeader("lieu", "Lieu") },
    {
      key: "chef", label: sortableHeader("chef", "Chef de projet"),
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%", background: COLORS.accentLight, color: COLORS.accent,
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard label="Projets en cours" value={countEnCours} icon={FolderKanban} subtext={`${countTermines} terminés au total`} />
          <StatCard label="À démarrer" value={countADemarrer} icon={CalendarClock} subtext="projets gagnés en attente" />
          <StatCard label="Budget engagé" value={fmt(budgetEngageTotal)} icon={Wallet} subtext="sur les projets en cours" />
          <StatCard label="Chefs de projet" value={chefs.length} icon={Users2} subtext="mobilisés actuellement" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 4, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: BORDERS.radius.md, padding: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "7px 14px",
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
            style={{ fontFamily: FONT, fontSize: 13, color: COLORS.text, padding: "8px 12px", borderRadius: BORDERS.radius.md, border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: "pointer" }}
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