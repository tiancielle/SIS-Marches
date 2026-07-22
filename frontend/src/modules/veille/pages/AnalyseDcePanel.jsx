import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles, AlertCircle, RotateCcw, FileStack, Wallet, Clock,
  ListChecks, Cpu, ClipboardList, CheckCircle2, AlertTriangle, FileText, ChevronRight
} from "lucide-react";
import { traiterDce, fetchAnalyseDce, fetchDocumentsDce } from "../../../services/analyseDce";
import Skeleton from "../../../components/ui/Skeleton";
import Badge from "../../../components/ui/Badge";
import DocumentsDceModal from "./DocumentsDceModal";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

const POLL_MS = 4000;
const TERMINAL = ["complete", "partielle", "echec"];

export default function AnalyseDcePanel({ appelOffresId, urlCps }) {
  const [phase, setPhase] = useState("checking");
  const [analyse, setAnalyse] = useState(null);
  const [error, setError] = useState(null);
  const [triggering, setTriggering] = useState(false);

  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const pollRef = useRef(null);

  async function checkOnce() {
    try {
      const data = await fetchAnalyseDce(appelOffresId);
      setAnalyse(data);
      setError(null);
      
      if (data.statut === "non_analyse") {
        setPhase("not_started");
        stopPolling();
      } else if (TERMINAL.includes(data.statut)) {
        setPhase("done");
        stopPolling();
      } else {
        setPhase("polling");
      }
    } catch (e) {
      setError(e.message);
      setPhase("error");
      stopPolling();
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(checkOnce, POLL_MS);
  }
  
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    checkOnce();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appelOffresId]);

  useEffect(() => {
    if (phase === "polling") startPolling();
    else stopPolling();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleLancer() {
    setTriggering(true);
    setError(null);
    try {
      await traiterDce(appelOffresId);
      await checkOnce();
    } catch (e) {
      setError(e.message);
      setPhase("error");
    } finally {
      setTriggering(false);
    }
  }

  async function openDocuments() {
    setDocsOpen(true);
    setDocsLoading(true);
    try {
      const data = await fetchDocumentsDce(appelOffresId);
      setDocs(data);
    } catch (e) {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }

  // --- NOUVEAUX COMPOSANTS D'AFFICHAGE ---

  // Titre de section agrandi et stylisé
  function SectionTitle({ icon: Icon, label }) {
    return (
      <h3 style={{ 
        fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.ink, 
        marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
        paddingBottom: 8, borderBottom: `1px solid ${C.line}`
      }}>
        <Icon size={16} color={C.accent} /> {label}
      </h3>
    );
  }

  // Liste intelligente : gère les anciens strings ET les nouveaux objets {label, detail}
  function RichList({ items, icon: Icon }) {
    if (!items || items.length === 0) return null;
    
    const isRich = typeof items[0] === "object" && items[0] !== null;

    return (
      <div style={{ marginBottom: 28 }}>
        <SectionTitle icon={Icon} label={getLabelForIcon(Icon)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, i) => {
            if (isRich) {
              const title = item.label || item.nom || item.critere || "Élément";
              const detail = item.detail || item.explication || item.sous_criteres || item.ponderation || "";
              return (
                <div key={i} style={{ 
                  background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, 
                  padding: "12px 14px", borderLeft: `3px solid ${C.accent}`
                }}>
                  <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
                    {title}
                  </div>
                  {detail && (
                    <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, lineHeight: 1.5 }}>
                      {detail}
                    </div>
                  )}
                </div>
              );
            }
            // Fallback élégant pour l'ancien format (simple string)
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <CheckCircle2 size={16} color={C.success} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function getLabelForIcon(Icon) {
    if (Icon === ListChecks) return "Compétences et exigences techniques";
    if (Icon === Cpu) return "Technologies ou méthodes mentionnées";
    if (Icon === ClipboardList) return "Pièces administratives requises";
    return "Détails";
  }

  function ActionRequiseCard({ action }) {
    const isObligatoire = action.priorite?.toLowerCase() === "obligatoire";
    const Icon = isObligatoire ? AlertTriangle : CheckCircle2;
    const bgColor = isObligatoire ? "#FEF2F2" : "#F0FDF4";
    const borderColor = isObligatoire ? "#FECACA" : "#BBF7D0";
    const iconColor = isObligatoire ? C.danger : C.success;

    return (
      <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Icon size={18} color={iconColor} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
              {action.action}
              {action.echeance && (
                <span style={{ fontWeight: 500, color: C.mute, fontSize: 12.5, marginLeft: 8 }}>
                  (Échéance : {action.echeance})
                </span>
              )}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute, lineHeight: 1.5, marginBottom: 8 }}>
              {action.details}
            </div>
            {action.type && (
              <span style={{ 
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11.5, fontWeight: 600, color: C.accent, background: "#FFFFFF", 
                padding: "3px 10px", borderRadius: 20, border: `1px solid ${C.accent}30`
              }}>
                <FileText size={12} /> {action.type}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={C.accent} /> Analyse du Dossier de Consultation
        </h2>
        {phase === "done" && <Badge status={analyse.statut} />}
      </div>

      {/* a) Pas encore traité */}
      {phase === "not_started" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.mute, margin: "0 0 16px" }}>
            Le dossier de consultation n'a pas encore été analysé par l'IA.
          </p>
          <button
            onClick={handleLancer}
            disabled={!urlCps || triggering}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 14, fontWeight: 600,
              color: "#fff", background: !urlCps || triggering ? C.faint : C.accent, border: "none", borderRadius: C.radius,
              padding: "10px 20px", cursor: !urlCps || triggering ? "default" : "pointer", boxShadow: C.shadow,
            }}
          >
            <Sparkles size={16} /> {triggering ? "Lancement en cours…" : "Lancer l'analyse du DCE"}
          </button>
          {!urlCps && (
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.danger, margin: "12px 0 0" }}>
              ⚠️ Veuillez d'abord télécharger le dossier de consultation ci-dessus.
            </p>
          )}
        </div>
      )}

      {/* checking initial */}
      {phase === "checking" && (
        <>
          <Skeleton width="60%" height={16} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={14} />
        </>
      )}

      {/* b) En cours */}
      {phase === "polling" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Sparkles size={18} color={C.accent} style={{ animation: "sis-pulse 1.4s ease infinite" }} />
            <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: C.ink }}>
              Analyse en cours, cela peut prendre une minute…
            </span>
          </div>
          <style>{`@keyframes sis-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
          <Skeleton width="90%" height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="75%" height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={12} />
        </div>
      )}

      {/* erreur réseau réelle */}
      {phase === "error" && (
        <div style={{ background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 8, padding: 16 }}>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.danger, display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}>
            <AlertCircle size={16} /> {error || "Impossible de récupérer l'analyse."}
          </p>
          <button onClick={checkOnce} style={secondaryBtnSm}>
            <RotateCcw size={14} /> Réessayer
          </button>
        </div>
      )}

      {/* c) Terminé */}
      {phase === "done" && analyse && (
        <div>
          {analyse.statut === "echec" && (
            <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.danger, background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 8, padding: "12px 14px", margin: "0 0 20px" }}>
              {analyse.erreur || "L'analyse a échoué sans message d'erreur détaillé."}
            </p>
          )}

          {analyse.statut === "partielle" && (
            <p style={{ fontFamily: FONT, fontSize: 13, color: "#92400E", background: "#FEF3C7", borderRadius: 8, padding: "12px 14px", margin: "0 0 20px" }}>
              Certains documents n'ont pas pu être exploités (ex: PDF scannés).{" "}
              <button onClick={openDocuments} style={{ ...linkBtnSm, color: "#92400E", textDecoration: "underline" }}>
                Voir le détail par document
              </button>
            </p>
          )}

          {analyse.statut !== "echec" && (
            <>
              {/* NOUVEAU : Section Actions Requises */}
              {analyse.actions_requises && analyse.actions_requises.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <SectionTitle icon={AlertTriangle} label="Documents et actions à préparer" />
                  {analyse.actions_requises.map((action, i) => (
                    <ActionRequiseCard key={i} action={action} />
                  ))}
                </div>
              )}

              {/* Résumé enrichi */}
              {analyse.resume && (
                <div style={{ marginBottom: 32, background: "#F8FAFC", borderLeft: `4px solid ${C.accent}`, padding: "16px 20px", borderRadius: "0 8px 8px 0" }}>
                  <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.faint, textTransform: "uppercase", margin: "0 0 10px", letterSpacing: 0.5 }}>
                    Résumé exécutif
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {analyse.resume}
                  </p>
                </div>
              )}

              {/* Sections enrichies (Listes intelligentes) */}
              <RichList items={analyse.competences_recherchees} icon={ListChecks} />
              <RichList items={analyse.technologies_mentionnees} icon={Cpu} />
              <RichList items={analyse.pieces_administratives} icon={ClipboardList} />
              <RichList items={analyse.criteres_evaluation} icon={ListChecks} />

              {/* Délais importants */}
              {analyse.delais_importants?.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionTitle icon={Clock} label="Délais importants" />
                  <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                    {analyse.delais_importants.map((d, i) => {
                      const libelle = typeof d === "string" ? d : (d.libelle || d);
                      const date = typeof d === "string" ? "Date non précisée" : (d.date || "Date non précisée");
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                          borderTop: i > 0 ? `1px solid ${C.line}` : "none", fontFamily: FONT, fontSize: 13.5,
                          background: i % 2 === 0 ? "transparent" : C.paper
                        }}>
                          <span style={{ color: C.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                            <ChevronRight size={14} color={C.mute} /> {libelle}
                          </span>
                          <span style={{ color: C.accent, fontWeight: 600, fontSize: 12.5, background: C.accentLt, padding: "4px 10px", borderRadius: 20 }}>
                            {date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Budget */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, fontSize: 14, color: C.mute, marginBottom: 24, background: C.paper, padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                <Wallet size={18} color={C.accent} /> 
                <span style={{ fontWeight: 600, color: C.ink }}>Budget estimatif : </span> 
                <span style={{ color: C.ink }}>{analyse.budget || "Non précisé dans les documents analysés"}</span>
              </div>
            </>
          )}

          {/* Footer du panneau */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
            <button onClick={openDocuments} style={linkBtnSm}>
              <FileStack size={14} /> Voir le détail des {analyse.nb_documents_analyses || 0} document(s) analysé(s)
            </button>
            <button onClick={handleLancer} disabled={triggering} style={secondaryBtnSm}>
              <RotateCcw size={14} /> {triggering ? "Relance…" : "Relancer l'analyse"}
            </button>
          </div>
        </div>
      )}

      {docsOpen && (
        <DocumentsDceModal documents={docs} loading={docsLoading} onClose={() => setDocsOpen(false)} />
      )}
    </div>
  );
}

const linkBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13,
  fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0,
};
const secondaryBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 600,
  color: C.ink, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer",
};