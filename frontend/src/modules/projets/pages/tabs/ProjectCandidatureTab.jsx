import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Upload, Check, Sparkles, Send, FileCheck2, Paperclip } from "lucide-react";
import { useData } from "../../../../store/DataContext";
import { fetchPiecesDossier, updatePieceDossierStatut, uploadPieceDossierDocument, pieceDossierDocumentUrl } from "../../../../services/pieceDossier";
import { C, FONT } from "../../../../styles/theme";

// Onglet de préparation du dossier de candidature à déposer.
// - url_avis : migré depuis l'AO d'origine, fourni par l'API.
// - Pièces à fournir : table piece_dossier persistante côté backend, pré-remplie
//   automatiquement à la conversion AO → Projet (une ligne par pièce détectée par
//   l'analyse IA). Le frontend ne dérive plus rien de l'analyse en direct — cette
//   table porte l'état "préparée"/"à préparer" et le fichier joint par l'utilisateur.
export default function ProjectCandidatureTab({ project }) {
  const { updateProject } = useData();
  const [submitting, setSubmitting] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [piecesLoading, setPiecesLoading] = useState(true);

  const urlPortail = project.url_avis;

  useEffect(() => {
    setPiecesLoading(true);
    fetchPiecesDossier(project.id)
      .then(setPieces)
      .catch(() => setPieces([]))
      .finally(() => setPiecesLoading(false));
  }, [project.id]);

  function handlePieceUpdated(updated) {
    setPieces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleMarquerSoumis() {
    setSubmitting(true);
    try {
      await updateProject(project.id, { ...project, statut: "soumis" });
    } finally {
      setSubmitting(false);
    }
  }

  const nbPreparees = pieces.filter((p) => p.statut === "preparee").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      {/* Lien portail */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "18px 20px" }}>
        <p style={sectionLabel}>Portail des marchés publics</p>
        {urlPortail ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute, wordBreak: "break-all" }}>{urlPortail}</span>
            <a href={urlPortail} target="_blank" rel="noreferrer" style={primaryBtn}>
              <ExternalLink size={14} /> Postuler sur le portail
            </a>
          </div>
        ) : (
          <EmptyText text={project.appel_offres_id ? "Lien du portail non renseigné pour cet appel d'offres." : "Ce projet n'est pas issu d'un appel d'offres — pas de lien de portail associé."} />
        )}
      </div>

      {/* Checklist pièces à déposer */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ ...sectionLabel, margin: 0 }}>Pièces à fournir</p>
          {pieces.length > 0 && (
            <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: nbPreparees === pieces.length ? C.success : C.mute, background: C.paper, padding: "2px 9px", borderRadius: 20, border: `1px solid ${C.line}` }}>
              {nbPreparees} / {pieces.length} préparées
            </span>
          )}
        </div>

        {piecesLoading ? (
          <EmptyText text="Chargement de la checklist…" />
        ) : pieces.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pieces.map((piece) => (
              <PieceRow key={piece.id} projetId={project.id} piece={piece} onUpdated={handlePieceUpdated} />
            ))}
          </div>
        ) : (
          <EmptyText text={project.appel_offres_id ? "Aucune pièce administrative dans le dossier de ce projet." : "Ce projet n'est pas issu d'un appel d'offres — pas de checklist automatique disponible."} />
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

function PieceRow({ projetId, piece, onUpdated }) {
  const [toggling, setToggling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const prepared = piece.statut === "preparee";

  async function toggle() {
    setToggling(true);
    try {
      const updated = await updatePieceDossierStatut(projetId, piece.id, prepared ? "a_preparer" : "preparee");
      onUpdated(updated);
    } finally {
      setToggling(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadPieceDossierDocument(projetId, piece.id, file);
      onUpdated(updated);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
      padding: "10px 12px", borderRadius: 8, background: prepared ? "#F6FAF7" : C.paper, border: `1px solid ${prepared ? "#DCEBDF" : C.line}`,
    }}>
      <div
        onClick={toggling ? undefined : toggle}
        role="checkbox"
        aria-checked={prepared}
        tabIndex={0}
        onKeyDown={(e) => { if (!toggling && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}
        style={{
          display: "flex", alignItems: "flex-start", gap: 9, cursor: toggling ? "default" : "pointer",
          textAlign: "left", flex: 1, minWidth: 0,
        }}
      >
        <span style={{
          width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: prepared ? C.success : "#fff", border: `1.5px solid ${prepared ? C.success : C.line}`,
        }}>
          {prepared && <Check size={12} color="#fff" strokeWidth={3} />}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink, lineHeight: 1.45 }}>
          {piece.libelle}
          {piece.document_path && piece.document_nom_original && (
            <a
              href={pieceDossierDocumentUrl(projetId, piece.id)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.accent, marginTop: 3, textDecoration: "none" }}
            >
              <Paperclip size={11} /> {piece.document_nom_original}
            </a>
          )}
        </span>
      </div>

      <button onClick={() => inputRef.current?.click()} disabled={uploading} style={ghostBtnSm}>
        {piece.document_nom_original ? <FileCheck2 size={12} /> : <Upload size={12} />}
        {uploading ? "Envoi…" : piece.document_nom_original ? "Remplacer" : "Ajouter"}
      </button>
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleFile} />
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
  color: C.mute, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 10px",
  cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
};