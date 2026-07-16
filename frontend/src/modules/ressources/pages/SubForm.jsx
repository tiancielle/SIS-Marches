import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { C, FONT } from "../../../styles/theme";

const EMPTY = { name: "", specialite: "", contact: "", email: "", phone: "", ice: "" };

export default function SubForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!initial) { setForm(EMPTY); return; }
    const cleaned = Object.fromEntries(
      Object.entries(initial).map(([k, v]) => [k, v ?? ""])
    );
    setForm({ ...EMPTY, ...cleaned });
  }, [initial]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.name.trim() && form.specialite.trim();

  return (
    <Modal
      title={initial ? "Modifier le sous-traitant" : "Nouveau sous-traitant"}
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
      <Field label="Nom" value={form.name} onChange={set("name")} required />
      <Field label="Spécialité" value={form.specialite} onChange={set("specialite")} required />
      <Field label="Contact" value={form.contact} onChange={set("contact")} />
      <Field label="Email" value={form.email} onChange={set("email")} type="email" />
      <Field label="Téléphone" value={form.phone} onChange={set("phone")} />
      <Field label="ICE" value={form.ice} onChange={set("ice")} />
    </Modal>
  );
}

const btnGhost = {
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute,
  background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer",
};
const btnPrimary = {
  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff",
  background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px",
};