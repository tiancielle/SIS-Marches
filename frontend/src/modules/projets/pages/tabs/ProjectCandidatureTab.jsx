import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, Upload, Check, Sparkles, Send, FileCheck2, Paperclip, Download, Archive } from "lucide-react";
import { useData } from "../../../../store/DataContext";
import { fetchPiecesDossier, updatePieceDossierStatut, uploadPieceDossierDocument, pieceDossierDocumentUrl, piecesDossierZipUrl } from "../../../../services/pieceDossier";
import { C, FONT } from "../../../../styles/theme";
import Badge from "../../../../components/ui/Badge";

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
  const progression = pieces.length > 0 ? Math.round((nbPreparees / pieces.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      {/* Résumé progression */}
      {pieces.length > 0 && (
        <div style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: C.radius,
          padding: "18px 20px",
          boxShadow: C.shadow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, margin: 0 }}>Pièces déposées</h3>
              <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: "4px 0 0" }}>
                {nbPreparees} / {pieces.length} préparées
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: FONT, fontSize: 21, fontWeight: 600, color: C.ink, margin: 0 }}>{progression}%</span>
            </div>
          </div>
          <div style={{
            height: 6,
            background: C.line,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progression}%`,
              background: C.success,
              borderRadius: 12,
              transition: "width 0.2s ease",
            }} />
          </div>
        </div>
      )}

      {/* Lien portail */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: C.radius,
        padding: "18px 20px",
        boxShadow: C.shadow,
      }}>
        <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Portail des marchés publics</h3>
        {urlPortail ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute, wordBreak: "break-all" }}>{urlPortail}</span>
            <a href={urlPortail} target="_blank" rel="noreferrer" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: C.accent,
              color: "#fff",
              textDecoration: "none",
              borderRadius: C.radius,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}>
              <ExternalLink size={14} /> Postuler sur le portail
            </a>
          </div>
        ) : (
          <EmptyText text={project.appel_offres_id ? "Lien du portail non renseigné pour cet appel d'offres." : "Ce projet n'est pas issu d'un appel d'offres — pas de lien de portail associé."} />
        )}
      </div>

      {/* Liste des pièces */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: C.radius,
        padding: "18px 20px",
        boxShadow: C.shadow,
      }}>
        <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 16 }}>Pièces à fournir</h3>

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

      {/* Téléchargement dossier complet */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: C.radius,
        padding: "18px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Télécharger le dossier complet</h3>
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: 0 }}>
            Archive ZIP de toutes les pièces déposées
          </p>
        </div>
        <a
          href={piecesDossierZipUrl(project.id)}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: C.radius,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <Archive size={14} /> Télécharger (.zip)
        </a>
      </div>

      {/* Génération présentation */}
      <div style={{
        background: C.card,
        border: `1px dashed ${C.line}`,
        borderRadius: C.radius,
        padding: "18px 20px",
      }}>
        <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Génération de présentation</h3>
        <div title="Bientôt disponible — en attente du backend">
          <button disabled style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: C.paper,
            color: C.faint,
            border: `1px solid ${C.line}`,
            borderRadius: C.radius,
            fontSize: 13,
            fontWeight: 600,
            cursor: "default",
          }}>
            <Sparkles size={14} /> Générer depuis le CPS
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: C.faint, margin: "8px 0 0", fontStyle: "italic" }}>
          Bientôt disponible.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleMarquerSoumis} disabled={submitting || project.statut === "soumis"} style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          background: submitting || project.statut === "soumis" ? C.paper : C.accent,
          color: submitting || project.statut === "soumis" ? C.faint : "#fff",
          border: `1px solid ${C.line}`,
          borderRadius: C.radius,
          fontSize: 13,
          fontWeight: 600,
          cursor: submitting || project.statut === "soumis" ? "default" : "pointer",
        }}>
          <Send size={14} /> {project.statut === "soumis" ? "Déjà marqué comme soumis" : submitting ? "…" : "Marquer comme soumis"}
        </button>
      </div>
    </div>
  );
}

function PieceRow({ projetId, piece, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const prepared = piece.statut === "preparee";

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadPieceDossierDocument(projetId, piece.id, file);
      // Mise à jour automatique du statut si pas déjà préparé
      if (updated.statut !== "preparee") {
        const statutUpdated = await updatePieceDossierStatut(projetId, piece.id, "preparee");
        onUpdated(statutUpdated);
      } else {
        onUpdated(updated);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      background: C.card,
      border: `1px solid ${C.line}`,
      borderRadius: C.radius,
      boxShadow: C.shadow,
    }}>
      {/* Checkbox */}
      <div style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: prepared ? C.success : C.card,
        border: `2px solid ${prepared ? C.success : C.line}`,
      }}>
        {prepared && <Check size={11} color="white" strokeWidth={3} />}
      </div>

      {/* Informations principales */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink }}>
            {piece.libelle}
          </span>
          <Badge status={prepared ? "soumis" : "brouillon"} />
        </div>
        
        {piece.document_nom_original && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Paperclip size={12} color={C.faint} />
              <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
                {piece.document_nom_original}
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.faint }}>
              {formatDate(piece.date_maj)}
            </span>
            <a
              href={pieceDossierDocumentUrl(projetId, piece.id)}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                color: C.accent,
                textDecoration: "none",
              }}
            >
              <Download size={12} /> Télécharger
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: C.card,
            color: C.ink,
            border: `1px solid ${C.line}`,
            borderRadius: C.radius,
            fontSize: 13,
            fontWeight: 600,
            cursor: uploading ? "default" : "pointer",
          }}
        >
          {uploading ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
              Envoi…
            </>
          ) : piece.document_nom_original ? (
            <>
              <FileCheck2 size={13} /> Remplacer
            </>
          ) : (
            <>
              <Upload size={13} /> Ajouter
            </>
          )}
        </button>
      </div>
      <input ref={inputRef} type="file" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <p style={{ 
      fontFamily: FONT, 
      fontSize: 13, 
      color: C.faint, 
      margin: 0, 
      lineHeight: 1.5, 
      fontStyle: "italic",
      textAlign: "center",
      padding: "32px",
    }}>
      {text}
    </p>
  );
}