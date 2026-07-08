import React, { useState } from "react";
import { FileText, FileX, X } from "lucide-react";
import Table from "../../../components/ui/Table";
import AssignSubModal from "./AssignSubModal";
import { useData } from "../../../context/DataContext";
import { C, FONT } from "../../../styles/theme";

export default function ProjectSubsTab({ projectId }) {
  const { getSubsForProject, unassignSub } = useData();
  const rows = getSubsForProject(projectId);
  const [showAssign, setShowAssign] = useState(false);

  const columns = [
    { key: "name", label: "Sous-traitant" },
    { key: "specialite", label: "Spécialité" },
    { key: "contact", label: "Contact" },
    {
      key: "contrat", label: "Contrat & document",
      render: (r) => r.fileUrl ? (
        <span
          onClick={(e) => { e.stopPropagation(); window.open(r.fileUrl, "_blank"); }}
          style={{ display: "flex", alignItems: "center", gap: 6, color: C.accent, fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <FileText size={14} /> {r.contratRef}
        </span>
      ) : r.contratRef ? (
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink }}>{r.contratRef}</span>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.faint, fontFamily: FONT, fontSize: 13 }}>
          <FileX size={14} /> Aucun document
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); unassignSub(projectId, r.id); }}
          title="Retirer ce sous-traitant du projet"
          style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex", alignItems: "center" }}
        >
          <X size={14} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={() => setShowAssign(true)}
          style={{
            fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.accent,
            background: C.accentLt, border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer"
          }}
        >
          + Affecter un sous-traitant
        </button>
      </div>
      <Table columns={columns} rows={rows} />

      {showAssign && (
        <AssignSubModal projectId={projectId} onClose={() => setShowAssign(false)} />
      )}
    </div>
  );
}