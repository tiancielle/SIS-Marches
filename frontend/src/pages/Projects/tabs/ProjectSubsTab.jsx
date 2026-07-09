import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import ContratForm from "../../Contrats/ContratForm";
import { useData } from "../../../context/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";

export default function ProjectSubsTab({ projectId }) {
  const navigate = useNavigate();
  const { getContratsForProject, subs, addContrat, removeContrat } = useData();
  const [showForm, setShowForm] = useState(false);

  const rows = getContratsForProject(projectId).map((c) => {
    const sub = subs.find((s) => s.id === c.sous_traitant_id);
    return { ...c, subName: sub?.name || "—", specialite: sub?.specialite || "—", contact: sub?.contact || "—" };
  });

  const columns = [
    { key: "subName", label: "Sous-traitant" },
    { key: "specialite", label: "Spécialité" },
    { key: "reference", label: "Contrat" },
    { key: "montant", label: "Montant", render: (r) => fmt(r.montant) },
    { key: "date_fin", label: "Échéance", render: (r) => fmtDate(r.date_fin) },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
    {
      key: "actions", label: "",
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm(`Supprimer le contrat ${r.reference} ?`)) removeContrat(r.id); }}
          title="Supprimer ce contrat"
          style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex" }}
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.accent, background: C.accentLt, border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}
        >
          + Affecter un sous-traitant (nouveau contrat)
        </button>
      </div>

      {rows.length > 0 ? (
        <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/contrats/${row.id}`)} />
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 32, textAlign: "center", fontFamily: FONT, fontSize: 13, color: C.faint }}>
          Aucun sous-traitant affecté pour l'instant.
        </div>
      )}

      {showForm && (
        <ContratForm
          fixedProjectId={projectId}
          onClose={() => setShowForm(false)}
          onSave={async (data) => { await addContrat(data); setShowForm(false); }}
        />
      )}
    </div>
  );
}