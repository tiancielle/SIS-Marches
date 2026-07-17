import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2, Mail, Phone, Briefcase } from "lucide-react";
import { useData } from "../../../store/DataContext";
import { fmtDate } from "../../../lib/mockData";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import EquipeForm from "./EquipeForm";
import { C, FONT } from "../../../styles/theme";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function SummaryItem({ icon: Icon, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Icon size={14} color={C.mute} />
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function EquipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipe, updateEquipeMembre, removeEquipeMembre, projectsForEquipeMembre } = useData();
  const [showForm, setShowForm] = useState(false);

  const membre = equipe.find((m) => String(m.id) === id);
  if (!membre) return <div style={{ padding: 32, color: C.faint }}>Membre introuvable.</div>;

  const projects = projectsForEquipeMembre(membre.id);

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
          <Link to="/equipe" style={{ color: C.faint, textDecoration: "none" }}>Équipe</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{membre.nom}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{membre.nom}</h1>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute, marginTop: 4 }}>{membre.intitule}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtnStyle} onClick={() => setShowForm(true)}>
              <Pencil size={14} /> Modifier
            </button>
            <button
              style={{ ...iconBtnStyle, color: C.danger }}
              onClick={() => { removeEquipeMembre(membre.id); navigate("/equipe"); }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 16, padding: "12px 16px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: C.radius, flexWrap: "wrap" }}>
          <SummaryItem icon={Briefcase} value={membre.type === "interne" ? "Interne" : "Freelance"} />
          <SummaryItem icon={Mail} value={membre.email || "—"} />
          <SummaryItem icon={Phone} value={membre.phone || "—"} />
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 20 }} />

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "18px 22px", maxWidth: 480 }}>
          <Row label="Type" value={membre.type === "interne" ? "Interne" : "Freelance"} />
          <Row label="Email" value={membre.email} />
          <Row label="Téléphone" value={membre.phone} />
          <Row label="Projets affectés" value={projects.length} />
        </div>

        <div>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
            Projets où intervient {membre.nom}
          </div>
          {projects.length > 0 ? (
            <Table columns={columns} rows={projects} onRowClick={(row) => navigate(`/projects/${row.id}`)} />
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 32, textAlign: "center", fontFamily: FONT, fontSize: 13, color: C.faint }}>
              Aucun projet associé pour l'instant.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EquipeForm
          initial={membre}
          onClose={() => setShowForm(false)}
          onSave={(data) => { updateEquipeMembre(membre.id, data); setShowForm(false); }}
        />
      )}
    </div>
  );
}

const iconBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13,
  fontWeight: 600, color: C.mute, background: C.card, border: `1px solid ${C.line}`,
  borderRadius: C.radius, padding: "7px 12px", cursor: "pointer",
};