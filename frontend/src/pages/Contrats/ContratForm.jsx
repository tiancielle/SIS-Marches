import React, { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { useData } from "../../context/DataContext";
import { C, FONT } from "../../styles/theme";

const EMPTY = { projet_id: "", sous_traitant_id: "", reference: "", montant: "", date_debut: "", date_fin: "", statut: "actif", document_nom: "" };

export default function ContratForm({ initial, onClose, onSave }) {
  const { projects, subs } = useData();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

useEffect(() => {
  if (initial) {
    const sanitized = Object.fromEntries(
      Object.entries(initial).map(([key, value]) => [key, value === null ? "" : value])
    );
    setForm({ ...EMPTY, ...sanitized });
  } else {
    setForm({ ...EMPTY, projet_id: projects[0]?.id || "", sous_traitant_id: subs[0]?.id || "" });
  }
}, [initial]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.projet_id && form.sous_traitant_id && form.reference.trim() && form.date_debut && form.date_fin;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        projet_id: Number(form.projet_id),
        sous_traitant_id: Number(form.sous_traitant_id),
        montant: Number(form.montant) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? "Modifier le contrat" : "Nouveau contrat"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Annuler</button>
          <button
            disabled={!canSave || saving}
            onClick={handleSave}
            style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5, cursor: canSave && !saving ? "pointer" : "not-allowed" }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Projet</label>
        <select value={form.projet_id} onChange={(e) => set("projet_id")(e.target.value)} style={selectStyle}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Sous-traitant</label>
        <select value={form.sous_traitant_id} onChange={(e) => set("sous_traitant_id")(e.target.value)} style={selectStyle}>
          {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <Field label="Référence" value={form.reference} onChange={set("reference")} required />
      <Field label="Montant (DH)" value={form.montant} onChange={set("montant")} type="number" />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Date début" value={form.date_debut} onChange={set("date_debut")} type="date" required /></div>
        <div style={{ flex: 1 }}><Field label="Date fin" value={form.date_fin} onChange={set("date_fin")} type="date" required /></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Statut</label>
        <select value={form.statut} onChange={(e) => set("statut")(e.target.value)} style={selectStyle}>
          <option value="actif">Actif</option>
          <option value="termine">Terminé</option>
          <option value="attente">En attente</option>
        </select>
      </div>

      <Field label="Nom du document (facultatif)" value={form.document_nom} onChange={set("document_nom")} />
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, marginTop: -8 }}>
        ⚠ Le stockage réel du fichier n'est pas encore géré — juste son nom pour l'instant.
      </div>
    </Modal>
  );
}

const labelStyle = { display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 };
const selectStyle = { width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none" };
const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };