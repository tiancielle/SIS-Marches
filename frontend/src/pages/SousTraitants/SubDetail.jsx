import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { fmtDate } from "../../lib/mockData";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import SubForm from "./SubForm";
import { C, FONT } from "../../styles/theme";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function SubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subs, updateSub, deleteSub, projectsForSub } = useData();
  const [showForm, setShowForm] = useState(false);

  const sub = subs.find((s) => String(s.id) === id);
  if (!sub) return <div style={{ padding: 32, color: C.faint }}>Sous-traitant introuvable.</div>;

  const projects = projectsForSub(sub.id);

  const columns = [
    { key: "nom", label: "Projet" },
    { key: "client", label: "Client" },
    { key: "fin", label: "Fin prévue", render: (r) => fmtDate(r.fin) },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  return (
    <div>
      <div style={{ padding: "18px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          <Link to="/sous-traitants" style={{ color: C.faint, textDecoration: "none" }}>Sous-traitants</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{sub.name}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>
              {sub.name}
            </h1>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute, marginTop: 4 }}>
              {sub.specialite}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtnStyle} onClick={() => setShowForm(true)}>
              <Pencil size={14} /> Modifier
            </button>
            <button
              style={{ ...iconBtnStyle, color: C.danger }}
              onClick={() => { deleteSub(sub.id); navigate("/sous-traitants"); }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16 }} />

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px" }}>
            <Row label="Contact" value={sub.contact} />
            <Row label="Email" value={sub.email} />
            <Row label="Téléphone" value={sub.phone} />
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px" }}>
            <Row label="ICE" value={sub.ice} />
            <Row label="Projets affectés" value={projects.length} />
          </div>
        </div>

        <div>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
            Projets où intervient {sub.name}
          </div>
          {projects.length > 0 ? (
            <Table columns={columns} rows={projects} onRowClick={(row) => navigate(`/projects/${row.id}`)} />
          ) : (
            <div style={{
              background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
              padding: 32, textAlign: "center", fontFamily: FONT, fontSize: 13, color: C.faint
            }}>
              Aucun projet associé pour l'instant.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SubForm
          initial={sub}
          onClose={() => setShowForm(false)}
          onSave={(data) => { updateSub(sub.id, data); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const iconBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13,
  fontWeight: 600, color: C.mute, background: C.card, border: `1px solid ${C.line}`,
  borderRadius: 6, padding: "7px 12px", cursor: "pointer",
};