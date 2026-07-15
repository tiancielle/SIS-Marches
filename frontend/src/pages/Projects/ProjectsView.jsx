import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Highlight from "../../components/ui/Highlight";
import ProjectForm from "./ProjectForm";
import { useData } from "../../context/DataContext";
import { fmtDate } from "../../lib/mockData";
import { C, FONT } from "../../styles/theme";

export default function ProjectsView() {
  const navigate = useNavigate();
  const { projects, addProject, getContratsForProject  } = useData();
  const [tab, setTab] = useState("actif");
  const [query, setQuery] = useState("");
  const [chefFilter, setChefFilter] = useState("");
  const [sort, setSort] = useState({ key: "nom", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

  const chefs = useMemo(() => [...new Set(projects.map((p) => p.chef))].sort(), [projects]);
  const countActif = projects.filter((p) => p.statut === "actif").length;
  const countTermine = projects.filter((p) => p.statut === "termine").length;

  const TABS = [
    { key: "actif", label: "Actifs", count: countActif },
    { key: "termine", label: "Historique", count: countTermine },
  ];

  const rows = useMemo(() => {
    let list = projects.filter((p) => p.statut === tab);
    if (chefFilter) list = list.filter((p) => p.chef === chefFilter);
    if (query) list = list.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [projects, tab, query, chefFilter, sort]);

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
    { key: "chef", label: sortableHeader("chef", "Chef de projet") },
    { key: "fin", label: "Fin prévue", render: (r) => fmtDate(r.fin) },
    { key: "subs", label: "Sous-traitants", render: (r) => getContratsForProject(r.id).length },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  const emptyMessage = query
    ? `Aucun projet ${tab === "actif" ? "actif" : "de l'historique"} ne correspond à « ${query} »`
    : chefFilter
    ? `Aucun projet ${tab === "actif" ? "actif" : "terminé"} pour ${chefFilter}`
    : "Aucun projet dans cette catégorie";

  return (
    <div>
      <Header
        title="Projets"
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau projet"
        onAction={() => setShowForm(true)}
      />

      <div style={{ padding: "20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "8px 14px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  color: tab === t.key ? C.ink : C.mute,
                  background: tab === t.key ? C.card : "transparent",
                  borderBottom: tab === t.key ? `2px solid ${C.accent}` : "2px solid transparent",
                }}
              >
                {t.label} <span style={{ color: C.faint, fontWeight: 500 }}>({t.count})</span>
              </button>
            ))}
          </div>

          <select
            value={chefFilter}
            onChange={(e) => setChefFilter(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}
          >
            <option value="">Tous les chefs de projet</option>
            {chefs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/projects/${row.id}`)} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
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