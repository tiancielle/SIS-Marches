import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HardHat, Layers, FolderKanban, FileCheck2 } from "lucide-react";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Highlight from "../../../components/ui/Highlight";
import StatCard from "../../../components/ui/StatCard";
import SubForm from "./SubForm";
import { useData } from "../../../store/DataContext";
import { C, FONT } from "../../../styles/theme";

export default function SubsView() {
  const navigate = useNavigate();
  const { subs, addSub, subProjectCount, contrats } = useData();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

  // KPI dérivés du même state que la liste — même pattern que Projets/Contrats.
  const specialitesCouvertes = new Set(subs.map((s) => s.specialite).filter(Boolean)).size;
  const mobilises = subs.filter((s) => subProjectCount(s.id) > 0).length;
  const contratsActifs = contrats.filter((c) => c.statut === "actif" && subs.some((s) => s.id === c.sous_traitant_id)).length;

  const rows = useMemo(() => {
    let list = subs;
    if (query) list = list.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [subs, query, sort]);

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const sortableHeader = (key, label) => (
    <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(key)}>
      {label} {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </span>
  );

  const columns = [
    { key: "name", label: sortableHeader("name", "Sous-traitant"), render: (r) => <Highlight text={r.name} query={query} /> },
    { key: "specialite", label: sortableHeader("specialite", "Spécialité") },
    { key: "contact", label: sortableHeader("contact", "Contact") },
    { key: "phone", label: "Téléphone" },
    { key: "projets", label: "Projets affectés", render: (r) => subProjectCount(r.id) },
  ];

  return (
    <div>
      <Header
        title="Sous-traitants"
        subtitle={`${subs.length} sous-traitant${subs.length > 1 ? "s" : ""} référencé${subs.length > 1 ? "s" : ""}`}
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau sous-traitant"
        onAction={() => setShowForm(true)}
      />
      <div style={{ padding: "20px 32px", background: C.paper }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard label="Sous-traitants" value={subs.length} icon={HardHat} subtext="au total" />
          <StatCard label="Spécialités couvertes" value={specialitesCouvertes} icon={Layers} subtext="domaines distincts" />
          <StatCard label="Mobilisés actuellement" value={mobilises} icon={FolderKanban} subtext="sur au moins un projet" />
          <StatCard label="Contrats actifs" value={contratsActifs} icon={FileCheck2} subtext="en cours avec eux" />
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/sous-traitants/${row.id}`)} />
        ) : (
          <div style={{
            background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
            padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint
          }}>
            {query ? `Aucun sous-traitant ne correspond à « ${query} »` : "Aucun sous-traitant référencé pour le moment"}
          </div>
        )}
      </div>

      {showForm && (
        <SubForm
          onClose={() => setShowForm(false)}
          onSave={(data) => { addSub(data); setShowForm(false); }}
        />
      )}
    </div>
  );
}