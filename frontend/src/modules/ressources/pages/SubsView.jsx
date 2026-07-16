import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Highlight from "../../../components/ui/Highlight";
import SubForm from "./SubForm";
import { useData } from "../../../store/DataContext";
import { C, FONT } from "../../../styles/theme";

export default function SubsView() {
  const navigate = useNavigate();
  const { subs, addSub, subProjectCount } = useData();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

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
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau sous-traitant"
        onAction={() => setShowForm(true)}
      />
      <div style={{ padding: "20px 32px" }}>
        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/sous-traitants/${row.id}`)} />
        ) : (
          <div style={{
            background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
            padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint
          }}>
            Aucun sous-traitant ne correspond à « {query} »
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