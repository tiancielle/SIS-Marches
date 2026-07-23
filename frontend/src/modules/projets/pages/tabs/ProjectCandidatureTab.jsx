import React, { useState } from "react";
import { ExternalLink, Upload, Check, Sparkles, Send } from "lucide-react";
import { useData } from "../../../../store/DataContext";
import { C, FONT } from "../../../../styles/theme";

// Onglet de préparation de la réponse à l'AO. La plupart des champs (url_avis,
// pieces_administratives migrées) n'existent pas encore côté backend (migration V2
// en cours) — affichés en placeholder élégant en attendant, comme pour l'analyse DCE.
export default function ProjectCandidatureTab({ project }) {
  const { updateProject } = useData();
  const [submitting, setSubmitting] = useState(false);

  const urlPortail = project.url_avis; // pas encore dans le schéma backend
  const pieces = project.pieces_administratives; // idem

  async function handleMarquerSoumis() {
    setSubmitting(true);
    try {
      await updateProject(project.id, { ...project, statut: "soumis" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      {/* Lien portail */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "18px 20px" }}>
        <p style={sectionLabel}>Portail des marchés publics</p>
        {urlPortail ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{urlPortail}</span>
            <a href={urlPortail} target="_blank" rel="noreferrer" style={primaryBtn}>
              <ExternalLink size={14} /> Postuler sur le portail
            </a>
          </div>
        ) : (
          <EmptyText text="Lien du portail non disponible pour l'instant — sera migré automatiquement depuis l'appel d'offres d'origine une fois la migration backend en place." />
        )}
      </div>

      {/* Checklist pièces */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "18px 20px" }}>
        <p style={sectionLabel}>Pièces à fournir</p>
        {pieces?.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pieces.map((piece, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13.5, color: C.ink }}>
                  <Check size={15} color={C.success} /> {piece}
                </span>
                <button style={ghostBtnSm}><Upload size={12} /> Ajouter</button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText text="Aucune pièce migrée pour l'instant — la checklist se remplira automatiquement depuis l'analyse IA de l'appel d'offres d'origine une fois la migration backend en place." />
        )}
      </div>

      {/* Génération présentation */}
      <div style={{ background: C.paper, border: `1px dashed ${C.line}`, borderRadius: C.radius, padding: "18px 20px" }}>
        <p style={sectionLabel}>Génération de présentation</p>
        <div title="Bientôt disponible — en attente du backend">
          <button disabled style={{ ...primaryBtn, background: C.faint, cursor: "default" }}>
            <Sparkles size={14} /> Générer depuis le CPS
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, margin: "8px 0 0", fontStyle: "italic" }}>
          Bientôt disponible.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleMarquerSoumis} disabled={submitting || project.statut === "soumis"} style={{
          ...primaryBtn, background: submitting || project.statut === "soumis" ? C.faint : C.accent,
          cursor: submitting || project.statut === "soumis" ? "default" : "pointer",
        }}>
          <Send size={14} /> {project.statut === "soumis" ? "Déjà marqué comme soumis" : submitting ? "…" : "Marquer comme soumis"}
        </button>
      </div>
    </div>
  );
}

function EmptyText({ text }) {
  return <p style={{ fontFamily: FONT, fontSize: 13, color: C.faint, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>{text}</p>;
}

const sectionLabel = {
  fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint,
  textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px",
};
const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
  color: "#fff", background: C.accent, border: "none", borderRadius: C.radius, padding: "9px 16px",
  cursor: "pointer", textDecoration: "none",
};
const ghostBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
  color: C.mute, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer",
};