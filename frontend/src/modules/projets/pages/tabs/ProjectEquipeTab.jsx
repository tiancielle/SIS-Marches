import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";
import Table from "../../../../components/ui/Table";
import { useData } from "../../../../store/DataContext";
import { C, FONT } from "../../../../styles/theme";

export default function ProjectEquipeTab({ projectId }) {
  const { equipe, getEquipeForProject, assignEquipeToProject, unassignEquipe } = useData();
  const rows = getEquipeForProject(projectId); // chaque row a déjà : id (id d'affectation), equipe_id, nom, intitule, type, email, phone, role
  const [showAssign, setShowAssign] = useState(false);
  const [equipeId, setEquipeId] = useState("");
  const [role, setRole] = useState("");

  const assignedIds = rows.map((r) => r.equipe_id);
  const available = equipe.filter((m) => !assignedIds.includes(m.id));

  const handleAssign = async () => {
    if (!equipeId || !role.trim()) return;
    await assignEquipeToProject(projectId, Number(equipeId), role);
    setShowAssign(false);
    setEquipeId("");
    setRole("");
  };

  const columns = [
    { key: "nom", label: "Membre" },
    { key: "intitule", label: "Intitulé général" },
    { key: "role", label: "Rôle sur ce projet" },
    {
      key: "actions", label: "",
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); unassignEquipe(r.id, projectId); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.faint, padding: 4 }}
        >
          <X size={14} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button
          onClick={() => setShowAssign(!showAssign)}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13,
            fontWeight: 600, color: C.accent, background: C.accentLt, border: "none",
            borderRadius: C.radius, padding: "8px 14px", cursor: "pointer",
          }}
        >
          <UserPlus size={14} /> Affecter un membre
        </button>
      </div>

      {showAssign && (
        <div style={{
          display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap",
          background: C.paper, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 12,
        }}>
          <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)} style={selectStyle}>
            <option value="">Choisir un membre…</option>
            {available.map((m) => <option key={m.id} value={m.id}>{m.nom} — {m.intitule}</option>)}
          </select>
          <input placeholder="Rôle sur ce projet" value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle} />
          <button
            onClick={handleAssign}
            style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: C.radius, padding: "8px 14px", cursor: "pointer" }}
          >
            Ajouter
          </button>
        </div>
      )}

      {rows.length > 0 ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 32, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
          Aucun membre affecté à ce projet pour le moment.
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px",
  borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card,
};