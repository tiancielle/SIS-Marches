import React, { useState } from "react";
import { AlertCircle, FileStack, Sparkles, History } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { interesserAppelOffre } from "../../../services/appelsOffres";
import { useData } from "../../../store/DataContext";
import { C, FONT } from "../../../styles/theme";

// Confirmation simple : seul le nom du projet est ajustable ici.
// Tout le reste (équipe, sous-traitants, contrats) se saisit manuellement
// ensuite depuis la fiche Projet — ce modal ne fait que déclencher la migration
// automatique de l'AO, son DCE, son analyse IA et son historique.
export default function InteresseModal({ appel, onClose, onSuccess }) {
  const { addProjectToState } = useData();
  const [nomProjet, setNomProjet] = useState(appel.objet || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const projet = await interesserAppelOffre(appel.id, { nom_projet: nomProjet });
      addProjectToState(projet);
      onSuccess(projet);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Je suis intéressé"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={ghostBtn}>Annuler</button>
          <button onClick={handleConfirm} disabled={submitting || !nomProjet} style={{
            ...primaryBtn, background: submitting || !nomProjet ? C.faint : C.accent,
            cursor: submitting || !nomProjet ? "default" : "pointer",
          }}>
            {submitting ? "Création…" : "Confirmer et créer le projet"}
          </button>
        </>
      }
    >
      <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: "0 0 16px", lineHeight: 1.5 }}>
        Un projet va être créé à partir de cet appel d'offres.
      </p>

      <Field label="Nom du projet" value={nomProjet} onChange={setNomProjet} required />

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { icon: FileStack, text: "L'appel d'offres et son dossier de consultation (DCE)" },
          { icon: Sparkles, text: "L'analyse IA déjà réalisée, si elle existe" },
          { icon: History, text: "L'historique de l'appel d'offres" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 12.5, color: C.mute }}>
            <Icon size={14} color={C.faint} /> {text}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: FONT, fontSize: 12, color: C.faint, margin: "16px 0 0" }}>
        L'équipe, les sous-traitants et les contrats se complètent ensuite manuellement depuis la fiche du projet.
      </p>

      {error && (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.danger, display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </Modal>
  );
}

const primaryBtn = {
  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: "#fff", border: "none",
  borderRadius: C.radius, padding: "9px 16px",
};
const ghostBtn = {
  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.mute, background: "none",
  border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "9px 16px", cursor: "pointer",
};