import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { C, FONT } from "../../../styles/theme";

const EMPTY = { nom: "", intitule: "", type: "interne", email: "", phone: "" };

export default function EquipeForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [initial]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.nom.trim() && form.intitule.trim();

  return (
    <Modal
      title={initial ? "Modifier le membre" : "Nouveau membre d'équipe"}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Annuler</button>
          <button
            disabled={!canSave}
            onClick={() => canSave && onSave(form)}
            style={{ ...btnPrimary, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <Field label="Nom" value={form.nom} onChange={set("nom")} required />
      <Field label="Intitulé / poste" value={form.intitule} onChange={set("intitule")} required />

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>Type</label>
        <select
          value={form.type}
          onChange={(e) => set("type")(e.target.value)}
          style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none" }}
        >
          <option value="interne">Interne</option>
          <option value="freelance">Freelance</option>
        </select>
      </div>

      <Field label="Email" value={form.email} onChange={set("email")} type="email" />
      <Field label="Téléphone" value={form.phone} onChange={set("phone")} />
    </Modal>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };