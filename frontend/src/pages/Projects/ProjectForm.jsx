import React, { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Field from "../../components/ui/Field";
import { C, FONT } from "../../styles/theme";

const EMPTY = { nom: "", client: "", lieu: "", chef: "", budget: "", budgetEngage: "", debut: "", fin: "", statut: "actif" };

export default function ProjectForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [initial]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // nom, client, debut, fin obligatoires désormais
  const canSave = form.nom.trim() && form.client.trim() && form.debut && form.fin;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ ...form, budget: Number(form.budget) || 0, budgetEngage: Number(form.budgetEngage) || 0 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? "Modifier le projet" : "Nouveau projet"}
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
      <Field label="Nom du projet" value={form.nom} onChange={set("nom")} required />
      <Field label="Client" value={form.client} onChange={set("client")} required />
      <Field label="Lieu" value={form.lieu} onChange={set("lieu")} />
      <Field label="Chef de projet" value={form.chef} onChange={set("chef")} />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Budget total (DH)" value={form.budget} onChange={set("budget")} type="number" /></div>
        <div style={{ flex: 1 }}><Field label="Budget engagé (DH)" value={form.budgetEngage} onChange={set("budgetEngage")} type="number" /></div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Début" value={form.debut} onChange={set("debut")} type="date" required /></div>
        <div style={{ flex: 1 }}><Field label="Fin prévue" value={form.fin} onChange={set("fin")} type="date" required /></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>
          Statut
        </label>
        <select
          value={form.statut}
          onChange={(e) => set("statut")(e.target.value)}
          style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none" }}
        >
          <option value="actif">Actif</option>
          <option value="termine">Terminé</option>
          <option value="brouillon">Brouillon</option>
        </select>
      </div>
    </Modal>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };