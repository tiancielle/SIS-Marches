import React, { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { C, FONT } from "../../../styles/theme";

const EMPTY = { reference: "", objet: "", organisme: "", montant_estimatif: "", date_limite_remise: "", type_procedure: "", url_avis: "", url_cps: "" };

export default function MarcheForm({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const canSave = form.reference.trim() && form.objet.trim() && form.organisme.trim();

  return (
    <Modal
      title="Nouvel appel d'offres"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Annuler</button>
          <button disabled={!canSave} onClick={() => canSave && onSave({ ...form, montant_estimatif: Number(form.montant_estimatif) || 0 })} style={{ ...btnPrimary, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
            Enregistrer
          </button>
        </>
      }
    >
      <Field label="Référence" value={form.reference} onChange={set("reference")} required />
      <Field label="Objet" value={form.objet} onChange={set("objet")} required />
      <Field label="Organisme" value={form.organisme} onChange={set("organisme")} required />
      <Field label="Montant estimatif (DH)" value={form.montant_estimatif} onChange={set("montant_estimatif")} type="number" />
      <Field label="Date limite de remise" value={form.date_limite_remise} onChange={set("date_limite_remise")} type="date" />
      <Field label="Type de procédure" value={form.type_procedure} onChange={set("type_procedure")} />
      <Field label="URL de l'avis" value={form.url_avis} onChange={set("url_avis")} />
      <Field label="URL du CPS" value={form.url_cps} onChange={set("url_cps")} />
    </Modal>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };