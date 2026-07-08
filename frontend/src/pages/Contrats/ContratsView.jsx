import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Highlight from "../../components/ui/Highlight";
import ContratForm from "./ContratForm";
import { useData } from "../../context/DataContext";
import { fmt, fmtDate } from "../../lib/mockData";
import { C, FONT } from "../../styles/theme";

export default function ContratsView() {
  const navigate = useNavigate();
  const { contrats, projects, subs, addContrat } = useData();
  const [query, setQuery] = useState("");
  const [projetFilter, setProjetFilter] = useState("");
  const [sort, setSort] = useState({ key: "reference", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

  const nomProjet = (id) => projects.find((p) => p.id === id)?.nom || "—";
  const nomSub = (id) => subs.find((s) => s.id === id)?.name || "—";

  const rows = useMemo(() => {
    let list = contrats;
    if (projetFilter) list = list.filter((c) => c.projet_id === Number(projetFilter));
    if (query) list = list.filter((c) => c.reference.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contrats, query, projetFilter, sort]);

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };
  const sortableHeader = (key, label) => (
    <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(key)}>
      {label} {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </span>
  );

  const columns = [
    { key: "reference", label: sortableHeader("reference", "Référence"), render: (r) => <Highlight text={r.reference} query={query} /> },
    { key: "projet", label: "Projet", render: (r) => nomProjet(r.projet_id) },
    { key: "sous_traitant", label: "Sous-traitant", render: (r) => nomSub(r.sous_traitant_id) },
    { key: "montant", label: "Montant", render: (r) => fmt(r.montant) },
    { key: "date_fin", label: "Échéance", render: (r) => fmtDate(r.date_fin) },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  return (
    <div>
      <Header
        title="Contrats"
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau contrat"
        onAction={() => setShowForm(true)}
      />
      <div style={{ padding: "20px 32px" }}>
        <div style={{ marginBottom: 16 }}>
          <select
            value={projetFilter}
            onChange={(e) => setProjetFilter(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/contrats/${row.id}`)} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
            Aucun contrat trouvé.
          </div>
        )}
      </div>

      {showForm && (
        <ContratForm onClose={() => setShowForm(false)} onSave={async (data) => { await addContrat(data); setShowForm(false); }} />
      )}
    </div>
  );
}