import React, { useState } from "react";
import { C, FONT } from "../../../styles/theme";

function EditRow({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}`, gap: 12 }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute, flexShrink: 0 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600, textAlign: "right",
          border: "none", outline: "none", background: "transparent", width: "60%"
        }}
      />
    </div>
  );
}

export default function ProjectInfoEdit({ project, onSave, onCancel }) {
  // Correctif : on spread l'intégralité de l'objet project pour ne perdre aucun champ (nom, statut, etc.)
  const [form, setForm] = useState({ ...project, budgetEngage: project.budgetEngage || 0 });
  
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.debut && form.fin;

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "18px 22px" }}>
          <EditRow label="Client" value={form.client} onChange={set("client")} />
          <EditRow label="Lieu" value={form.lieu} onChange={set("lieu")} />
          <EditRow label="Chef de projet" value={form.chef} onChange={set("chef")} />
          <EditRow label="Budget total" value={form.budget} onChange={set("budget")} type="number" />
          <EditRow label="Budget engagé" value={form.budgetEngage} onChange={set("budgetEngage")} type="number" />
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.accent}`, borderRadius: 8, padding: "18px 22px" }}>
          <EditRow label="Début" value={form.debut} onChange={set("debut")} type="date" />
          <EditRow label="Fin prévue" value={form.fin} onChange={set("fin")} type="date" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnGhost}>Annuler</button>
        <button
          disabled={!canSave || saving}
          onClick={handleSave}
          style={{ ...btnPrimary, opacity: canSave && !saving ? 1 : 0.5, cursor: canSave && !saving ? "pointer" : "not-allowed" }}
        >
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };