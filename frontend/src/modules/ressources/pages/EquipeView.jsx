import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Highlight from "../../../components/ui/Highlight";
import EquipeForm from "./EquipeForm";
import { useData } from "../../../store/DataContext";
import { C, FONT } from "../../../styles/theme";


const TYPE_LABEL = { interne: "Interne", freelance: "Freelance" };

export default function EquipeView() {
  const navigate = useNavigate();
  const { equipe, addEquipeMembre, projectsForEquipeMembre } = useData();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => {
    let list = equipe;
    if (typeFilter) list = list.filter((m) => m.type === typeFilter);
    if (query) list = list.filter((m) => m.nom.toLowerCase().includes(query.toLowerCase()));
    return [...list].sort((a, b) => a.nom.localeCompare(b.nom));
  }, [equipe, query, typeFilter]);

  const columns = [
    { key: "nom", label: "Nom", render: (r) => <Highlight text={r.nom} query={query} /> },
    { key: "intitule", label: "Intitulé" },
    { key: "type", label: "Type", render: (r) => TYPE_LABEL[r.type] },
    { key: "email", label: "Email" },
    { key: "projets", label: "Projets affectés", render: (r) => projectsForEquipeMembre(r.id).length },
  ];

  return (
    <div>
      <Header
        title="Équipe"
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau membre"
        onAction={() => setShowForm(true)}
      />
      <div style={{ padding: "20px 32px" }}>
        <div style={{ marginBottom: 16 }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}
          >
            <option value="">Tous les types</option>
            <option value="interne">Interne</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/equipe/${row.id}`)} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
            Aucun membre ne correspond.
          </div>
        )}
      </div>

      {showForm && (
        <EquipeForm onClose={() => setShowForm(false)} onSave={(data) => { addEquipeMembre(data); setShowForm(false); }} />
      )}
    </div>
  );
}