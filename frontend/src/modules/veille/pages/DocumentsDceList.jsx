import React from "react";
import { FileText, CheckCircle2, XCircle, HelpCircle, ExternalLink } from "lucide-react";
import { documentFileUrl } from "../../../services/analyseDce";
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

export default function DocumentsDceList({ documents, loading, appelOffresId, emptyText = "Aucun document indexé pour l'instant." }) {
  if (loading) {
    return <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>Chargement…</p>;
  }

  if (!documents || documents.length === 0) {
    return <p style={{ fontFamily: FONT, fontSize: 13, color: C.faint }}>{emptyText}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {documents.map((doc) => {
        const st = STATUT_ICON[doc.statut_extraction] || STATUT_ICON.non_supporte;
        const href = appelOffresId ? documentFileUrl(appelOffresId, doc.id) : null;

        const content = (
          <>
            <FileText size={15} color={C.faint} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: href ? C.accent : C.ink, margin: "0 0 3px", wordBreak: "break-word", textDecoration: href ? "none" : "none" }}>
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
            {href ? <ExternalLink size={15} color={C.accent} style={{ flexShrink: 0, marginTop: 2 }} /> : <st.Icon size={16} color={st.color} style={{ flexShrink: 0, marginTop: 2 }} />}
          </>
        );

        const rowStyle = {
          display: "flex", gap: 10, alignItems: "flex-start",
          border: `1px solid ${C.line}`, borderRadius: 8, padding: 12,
        };

        return href ? (
          <a key={doc.id} href={href} target="_blank" rel="noreferrer" style={{ ...rowStyle, textDecoration: "none", cursor: "pointer" }}>
            {content}
          </a>
        ) : (
          <div key={doc.id} style={rowStyle}>{content}</div>
        );
      })}
    </div>
  );
}