import React, { useEffect, useState } from "react";
import { FileStack, AlertCircle } from "lucide-react";
import { fetchDocumentsDceForProjet } from "../../../../services/projetDce";
import DocumentsDceList from "../../../veille/pages/DocumentsDceList";
import { C, FONT, FONT_DISPLAY } from "../../../../styles/theme";

// Documents déjà téléchargés/indexés lors du traitement du DCE de l'appel d'offres
// d'origine (RC, CPS, CCAP, annexes...). Lecture seule, aucun re-téléchargement :
// les mêmes fichiers que ceux visibles côté Veille pour cet AO.
export default function ProjectDocsTab({ project }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project.appel_offres_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchDocumentsDceForProjet(project.appel_offres_id)
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [project.appel_offres_id]);

  if (!project.appel_offres_id) {
    return (
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
        padding: "48px 32px", textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", background: C.paper, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: C.faint,
        }}>
          <FileStack size={18} strokeWidth={1.75} />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
          Aucun document à afficher
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.faint, maxWidth: 360, margin: "0 auto" }}>
          Ce projet n'est pas issu d'un appel d'offres — il n'y a donc pas de documents de DCE associés.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "20px 22px", maxWidth: 640 }}>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 14px" }}>
        Documents du dossier de consultation
      </p>

      {error ? (
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} /> {error}
        </p>
      ) : (
        <DocumentsDceList
          documents={docs}
          loading={loading}
          appelOffresId={project.appel_offres_id}
          emptyText="Aucun document indexé pour ce dossier."
        />
      )}
    </div>
  );
}