import React, { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { useData } from "../../../context/DataContext";
import { C, FONT } from "../../../styles/theme";

export default function AssignSubModal({ projectId, onClose }) {
  const { subs, getSubsForProject, assignSubToProject } = useData();
  const alreadyAssignedIds = getSubsForProject(projectId).map((s) => s.id);
  const available = subs.filter((s) => !alreadyAssignedIds.includes(s.id));

  const [subId, setSubId] = useState(available[0]?.id || "");
  const [contratRef, setContratRef] = useState("");
  const [file, setFile] = useState(null);

  const canSave = subId && contratRef.trim();

  const handleSave = () => {
    if (!canSave) return;
    assignSubToProject(projectId, Number(subId), contratRef, file);
    onClose();
  };

  return (
    <Modal
      title="Affecter un sous-traitant"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={btnGhost}>Annuler</button>
          <button
            disabled={!canSave}
            onClick={handleSave}
            style={{ ...btnPrimary, opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            Affecter
          </button>
        </>
      }
    >
      {available.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
          Tous les sous-traitants existants sont déjà affectés à ce projet.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>
              Sous-traitant
            </label>
            <select
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              style={{ width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink, padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.paper, outline: "none" }}
            >
              {available.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.specialite}</option>
              ))}
            </select>
          </div>

          <Field label="Référence du contrat" value={contratRef} onChange={setContratRef} required />

          <div style={{ marginBottom: 4 }}>
            <label style={{ display: "block", fontFamily: FONT, fontSize: 12, color: C.mute, marginBottom: 5, fontWeight: 600 }}>
              Document du contrat (facultatif)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ fontFamily: FONT, fontSize: 13, color: C.ink }}
            />
            <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, marginTop: 4 }}>
              ⚠ Stockage temporaire (navigateur uniquement) — sera remplacé par un vrai
              stockage serveur une fois le backend branché. Perdu au rafraîchissement.
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnPrimary = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.accent, border: "none", borderRadius: 6, padding: "8px 14px" };