import React, { useState } from "react";
import { useData } from "../../../../store/DataContext";
import { fmt, fmtDate } from "../../../../lib/mockData";
import { C, FONT } from "../../../../styles/theme";

const EMPTY = { objet: "", organisme: "", montant_estimatif: "", date_limite_remise: "", type_procedure: "", pieces_exigees: "", document_nom: "" };

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}`, gap: 16 }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

function EditRow({ label, value, onChange, type = "text", textarea }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4}
          style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none", boxSizing: "border-box" }} />
      )}
    </div>
  );
}

export default function ProjectDCETab({ projectId }) {
  const { getDCEForProject, addDCE, editDCE, removeDCE, dceFiles, setDceFile } = useData();
  const dce = getDCEForProject(projectId);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const startEdit = () => {
    if (dce) {
      const sanitized = Object.fromEntries(Object.entries(dce).map(([k, v]) => [k, v === null ? "" : v]));
      setForm({ ...EMPTY, ...sanitized });
    } else {
      setForm(EMPTY);
    }
    setFile(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        projet_id: projectId,
        montant_estimatif: form.montant_estimatif === "" ? null : Number(form.montant_estimatif),
        date_limite_remise: form.date_limite_remise || null,
      };
      if (file) payload.document_nom = file.name;

      const result = dce ? await editDCE(dce.id, payload) : await addDCE(payload);
      if (file && result?.id) setDceFile(result.id, file);

      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!dce) return;
    if (!window.confirm("Supprimer la fiche DCE de ce projet ?")) return;
    await removeDCE(dce.id);
  };

  if (editing) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "20px 24px", maxWidth: 560 }}>
        <EditRow label="Objet du marché" value={form.objet} onChange={set("objet")} textarea />
        <EditRow label="Organisme" value={form.organisme} onChange={set("organisme")} />
        <EditRow label="Montant estimatif (DH)" value={form.montant_estimatif} onChange={set("montant_estimatif")} type="number" />
        <EditRow label="Date limite de remise" value={form.date_limite_remise} onChange={set("date_limite_remise")} type="date" />
        <EditRow label="Type de procédure" value={form.type_procedure} onChange={set("type_procedure")} />
        <EditRow label="Pièces exigées (une par ligne)" value={form.pieces_exigees} onChange={set("pieces_exigees")} textarea />
        <EditRow label="Nom du document DCE" value={form.document_nom} onChange={set("document_nom")} />

        <div style={{ marginBottom: 4 }}>
          <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>
            Fichier DCE (facultatif)
          </label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontFamily: FONT, fontSize: 13 }} />
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, marginTop: 4 }}>
            ⚠ Stockage temporaire (navigateur), perdu au rafraîchissement — en attendant le vrai stockage backend.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => setEditing(false)} style={btnGhost}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    );
  }

  if (!dce) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.faint, marginBottom: 14 }}>Aucune fiche DCE pour ce projet.</div>
        <button onClick={startEdit} style={btnPrimary}>Créer la fiche DCE</button>
      </div>
    );
  }

  const fileEntry = dceFiles[dce.id];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px", maxWidth: 560 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 6 }}>
        <button onClick={startEdit} style={btnGhost}>Modifier</button>
        <button onClick={handleDelete} style={{ ...btnGhost, color: C.danger }}>Supprimer</button>
      </div>
      <Row label="Objet du marché" value={dce.objet} />
      <Row label="Organisme" value={dce.organisme} />
      <Row label="Montant estimatif" value={dce.montant_estimatif ? fmt(dce.montant_estimatif) : null} />
      <Row label="Date limite de remise" value={dce.date_limite_remise ? fmtDate(dce.date_limite_remise) : null} />
      <Row label="Type de procédure" value={dce.type_procedure} />
      <Row label="Pièces exigées" value={dce.pieces_exigees} />
      <Row label="Document" value={dce.document_nom} />

      {fileEntry && (
        <div style={{ padding: "11px 0" }}>
          <span onClick={() => window.open(fileEntry.fileUrl, "_blank")} style={{ color: C.accent, fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📄 Voir le fichier ({fileEntry.fileName})
          </span>
        </div>
      )}
    </div>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" };