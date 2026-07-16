import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Highlight from "../../../components/ui/Highlight";
import MarcheForm from "./MarcheForm";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";

export default function MarchesView() {
  const navigate = useNavigate();
  const { marches, addMarche, getAnalyseForMarche } = useData();
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const rows = useMemo(() => {
    let list = marches;
    if (statutFilter) list = list.filter((m) => m.statut === statutFilter);
    if (query) list = list.filter((m) => m.objet.toLowerCase().includes(query.toLowerCase()) || m.reference.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [marches, query, statutFilter]);

  const columns = [
    { key: "reference", label: "Référence" },
    { key: "objet", label: "Objet", render: (r) => <Highlight text={r.objet} query={query} /> },
    { key: "organisme", label: "Organisme" },
    { key: "montant_estimatif", label: "Montant estimatif", render: (r) => (r.montant_estimatif ? fmt(r.montant_estimatif) : "—") },
    { key: "date_limite_remise", label: "Date limite", render: (r) => (r.date_limite_remise ? fmtDate(r.date_limite_remise) : "—") },
    {
      key: "score", label: "Score IA",
      render: (r) => {
        const a = getAnalyseForMarche(r.id);
        return a ? <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: a.score_pertinence >= 60 ? C.success : C.mute }}>{a.score_pertinence}</span> : "—";
      },
    },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  return (
    <div>
      <Header title="Marchés publics" searchValue={query} onSearchChange={setQuery} actionLabel="Nouveau" onAction={() => setShowForm(true)} />
      <div style={{ padding: "20px 32px" }}>
        <div style={{ marginBottom: 16 }}>
          <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}>
            <option value="">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="analyse">Analysé</option>
            <option value="converti">Converti</option>
            <option value="ignore">Ignoré</option>
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/marches/${row.id}`)} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
            Aucun marché.
          </div>
        )}
      </div>

      {showForm && <MarcheForm onClose={() => setShowForm(false)} onSave={(data) => { addMarche(data); setShowForm(false); }} />}
    </div>
  );
}