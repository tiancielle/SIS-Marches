import React from "react";
import { FileText, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { C, FONT } from "../../../styles/theme";

const STATUT_ICON = {
  succes: { Icon: CheckCircle2, color: C.success },
  echec: { Icon: XCircle, color: C.danger },
  non_supporte: { Icon: HelpCircle, color: C.faint },
};

function fmtSize(o) {
  if (!o) return "";
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} Ko`;
  return `${(o / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsDceModal({ documents, loading, onClose }) {
  return (
    <Modal title="Documents indexés" onClose={onClose}>
      {loading && (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>Chargement…</p>
      )}

      {!loading && documents.length === 0 && (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.faint }}>
          Aucun document indexé pour l'instant.
        </p>
      )}

      {!loading && documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {documents.map((doc) => {
            const st = STATUT_ICON[doc.statut_extraction] || STATUT_ICON.non_supporte;
            return (
              <div key={doc.id} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                border: `1px solid ${C.line}`, borderRadius: 8, padding: 12,
              }}>
                <FileText size={15} color={C.faint} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.ink, margin: "0 0 3px", wordBreak: "break-word" }}>
                    {doc.nom_fichier}
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, margin: 0 }}>
                    {doc.type_fichier?.toUpperCase()} · {fmtSize(doc.taille_octets)}
                    {doc.nb_caracteres_extraits ? ` · ${doc.nb_caracteres_extraits.toLocaleString("fr-FR")} caractères extraits` : ""}
                  </p>
                  {doc.erreur && (
                    <p style={{ fontFamily: FONT, fontSize: 11.5, color: C.danger, margin: "4px 0 0" }}>
                      {doc.erreur}
                    </p>
                  )}
                </div>
                <st.Icon size={16} color={st.color} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}