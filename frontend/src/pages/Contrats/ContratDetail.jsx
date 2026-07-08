import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useData } from "../../context/DataContext";
import { fmt, fmtDate } from "../../lib/mockData";
import Badge from "../../components/ui/Badge";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ContratForm from "./ContratForm";
import { C, FONT } from "../../styles/theme";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function ContratDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contrats, projects, subs, editContrat, removeContrat } = useData();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const contrat = contrats.find((c) => String(c.id) === id);
  if (!contrat) return <div style={{ padding: 32, color: C.faint }}>Contrat introuvable.</div>;

  const projet = projects.find((p) => p.id === contrat.projet_id);
  const sub = subs.find((s) => s.id === contrat.sous_traitant_id);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeContrat(contrat.id);
      navigate("/contrats");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ padding: "18px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          <Link to="/contrats" style={{ color: C.faint, textDecoration: "none" }}>Contrats</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{contrat.reference}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{contrat.reference}</h1>
            <div style={{ marginTop: 6 }}><Badge status={contrat.statut} /></div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtnStyle} onClick={() => setShowForm(true)}>
              <Pencil size={14} /> Modifier
            </button>
            <button style={{ ...iconBtnStyle, color: C.danger }} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16 }} />

      <div style={{ padding: 32 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px", maxWidth: 480 }}>
          <Row label="Projet" value={projet ? <Link to={`/projects/${projet.id}`} style={{ color: C.accent }}>{projet.nom}</Link> : "—"} />
          <Row label="Sous-traitant" value={sub ? <Link to={`/sous-traitants/${sub.id}`} style={{ color: C.accent }}>{sub.name}</Link> : "—"} />
          <Row label="Montant" value={fmt(contrat.montant)} />
          <Row label="Date début" value={fmtDate(contrat.date_debut)} />
          <Row label="Date fin" value={fmtDate(contrat.date_fin)} />
          <Row label="Document" value={contrat.document_nom || "Aucun"} />
        </div>
      </div>

      {showForm && (
        <ContratForm
          initial={contrat}
          onClose={() => setShowForm(false)}
          onSave={async (data) => { await editContrat(contrat.id, data); setShowForm(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce contrat ?"
          message={`Voulez-vous vraiment supprimer le contrat "${contrat.reference}" ? Cette action est irréversible.`}
          confirmLabel={deleting ? "Suppression…" : "Supprimer"}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
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