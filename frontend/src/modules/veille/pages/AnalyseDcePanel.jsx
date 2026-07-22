import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles, AlertCircle, RotateCcw, FileStack, Wallet, Clock,
  ListChecks, Cpu, ClipboardList,
} from "lucide-react";
import { traiterDce, fetchAnalyseDce, fetchDocumentsDce } from "../../../services/analyseDce";
import Skeleton from "../../../components/ui/Skeleton";
import Badge from "../../../components/ui/Badge";
import DocumentsDceModal from "./DocumentsDceModal";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

const POLL_MS = 4000;
const TERMINAL = ["complete", "partielle", "echec"];

export default function AnalyseDcePanel({ appelOffresId, urlCps }) {
  const [phase, setPhase] = useState("checking"); // checking | not_started | polling | done | error
  const [analyse, setAnalyse] = useState(null);
  const [error, setError] = useState(null);
  const [triggering, setTriggering] = useState(false);

  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const pollRef = useRef(null);
  const triggeredRef = useRef(false);

  async function checkOnce() {
    try {
      const data = await fetchAnalyseDce(appelOffresId);
      setAnalyse(data);
      setError(null);
      triggeredRef.current = true;
      if (TERMINAL.includes(data.statut)) {
        setPhase("done");
        stopPolling();
      } else {
        setPhase("polling");
      }
    } catch (e) {
      if (e.status === 404) {
        if (triggeredRef.current) {
          // Le traitement vient d'être lancé mais la ligne n'est pas encore en base —
          // ce n'est pas "jamais lancé", on reste en attente et le prochain poll retentera.
          setPhase("polling");
        } else {
          setPhase("not_started");
          stopPolling();
        }
      } else {
        setError(e.message);
        setPhase("error");
        stopPolling();
      }
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
    triggeredRef.current = true;
    try {
      await traiterDce(appelOffresId);
      setPhase("polling");
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

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 22, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} /> Analyse du DCE
        </p>
        {phase === "done" && <Badge status={analyse.statut} />}
      </div>

      {/* a) Pas encore traité */}
      {phase === "not_started" && (
        <div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: "0 0 12px" }}>
            Le dossier de consultation n'a pas encore été analysé.
          </p>
          <div title={!urlCps ? "Télécharge d'abord le dossier de consultation ci-dessus" : undefined}>
            <button
              onClick={handleLancer}
              disabled={!urlCps || triggering}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
                color: "#fff", background: !urlCps || triggering ? C.faint : C.accent, border: "none", borderRadius: C.radius,
                padding: "9px 16px", cursor: !urlCps || triggering ? "default" : "pointer",
              }}
            >
              <Sparkles size={14} /> {triggering ? "Lancement…" : "Lancer l'analyse du DCE"}
            </button>
          </div>
          {!urlCps && (
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.faint, margin: "8px 0 0" }}>
              Dossier de consultation non téléchargé — récupère-le d'abord ci-dessus.
            </p>
          )}
        </div>
      )}

      {/* checking initial */}
      {phase === "checking" && (
        <>
          <Skeleton width="70%" height={13} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={13} />
        </>
      )}

      {/* b) En cours */}
      {phase === "polling" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={15} color={C.accent} style={{ animation: "sis-pulse 1.4s ease infinite" }} />
            <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>
              Analyse en cours, ça peut prendre une minute…
            </span>
          </div>
          <style>{`@keyframes sis-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
          <Skeleton width="90%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="75%" height={12} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={12} />
        </div>
      )}

      {/* erreur réseau réelle (pas un 404) */}
      {phase === "error" && (
        <div>
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
            <AlertCircle size={15} /> {error || "Impossible de récupérer l'analyse."}
          </p>
          <button onClick={checkOnce} style={secondaryBtnSm}>
            <RotateCcw size={13} /> Réessayer
          </button>
        </div>
      )}

      {/* c) Terminé */}
      {phase === "done" && analyse && (
        <div>
          {analyse.statut === "echec" && (
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, background: "#FBEAE9", borderRadius: 8, padding: "10px 12px", margin: "0 0 14px" }}>
              {analyse.erreur || "L'analyse a échoué sans message d'erreur détaillé."}
            </p>
          )}

          {analyse.statut === "partielle" && (
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.warning, background: "#FBF1E1", borderRadius: 8, padding: "10px 12px", margin: "0 0 14px" }}>
              Certains documents n'ont pas pu être exploités.{" "}
              <button onClick={openDocuments} style={{ ...linkBtnSm, color: "#8A6A1F" }}>
                Voir le détail par document
              </button>
            </p>
          )}

          {analyse.statut !== "echec" && (
            <>
              {analyse.resume && (
                <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.55, margin: "0 0 16px" }}>
                  {analyse.resume}
                </p>
              )}

              <TagSection icon={ListChecks} label="Compétences recherchées" items={analyse.competences_recherchees} />
              <TagSection icon={Cpu} label="Technologies mentionnées" items={analyse.technologies_mentionnees} />
              <TagSection icon={ClipboardList} label="Pièces administratives" items={analyse.pieces_administratives} />
              <TagSection icon={ListChecks} label="Critères d'évaluation" items={analyse.criteres_evaluation} />

              {analyse.delais_importants?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={sectionLabel}><Clock size={12} /> Délais importants</p>
                  <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                    {analyse.delais_importants.map((d, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", padding: "8px 12px",
                        borderTop: i > 0 ? `1px solid ${C.line}` : "none", fontFamily: FONT, fontSize: 12.5,
                      }}>
                        <span style={{ color: C.ink }}>{d.libelle}</span>
                        <span style={{ color: C.mute }}>{d.date || "Date non précisée"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.mute, marginBottom: 16 }}>
                <Wallet size={13} /> {analyse.budget || "Budget non précisé"}
              </div>
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={openDocuments} style={linkBtnSm}>
                <FileStack size={13} /> {analyse.nb_documents_analyses} document{analyse.nb_documents_analyses > 1 ? "s" : ""} analysé{analyse.nb_documents_analyses > 1 ? "s" : ""}
              </button>
            </div>
            <button onClick={handleLancer} disabled={triggering} style={secondaryBtnSm}>
              <RotateCcw size={13} /> {triggering ? "Relance…" : "Relancer l'analyse"}
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

function TagSection({ icon: Icon, label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={sectionLabel}><Icon size={12} /> {label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((it, i) => (
          <span key={i} style={{
            fontFamily: FONT, fontSize: 12, color: C.ink, background: C.paper,
            border: `1px solid ${C.line}`, borderRadius: 20, padding: "4px 10px",
          }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

const sectionLabel = {
  display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 11.5,
  fontWeight: 600, color: C.faint, margin: "0 0 8px",
};
const linkBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 12,
  fontWeight: 600, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0,
};
const secondaryBtnSm = {
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
  color: C.ink, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer",
};
