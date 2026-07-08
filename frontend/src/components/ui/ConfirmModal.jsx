import React from "react";
import Modal from "./Modal";
import { C, FONT } from "../../styles/theme";

export default function ConfirmModal({ title, message, confirmLabel = "Supprimer", onCancel, onConfirm }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} style={btnGhost}>Annuler</button>
          <button onClick={onConfirm} style={btnDanger}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, margin: 0 }}>{message}</p>
    </Modal>
  );
}

const btnGhost = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const btnDanger = { fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#fff", background: C.danger, border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" };