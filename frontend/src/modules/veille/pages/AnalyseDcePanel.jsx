import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles, AlertCircle, RotateCcw, FileStack, Wallet, Clock,
  ListChecks, Cpu, ClipboardList, CheckCircle2, AlertTriangle, FileText,
  ChevronRight, ChevronDown, Target, ShieldAlert, Lightbulb,
} from "lucide-react";
import { traiterDce, fetchAnalyseDce, fetchDocumentsDce } from "../../../services/analyseDce";
import Skeleton from "../../../components/ui/Skeleton";
import Badge from "../../../components/ui/Badge";
import DocumentsDceModal from "./DocumentsDceModal";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

const POLL_MS = 4000;
const TERMINAL = ["complete", "partielle", "echec"];

// --- Rendu d'un item de liste : gère les strings simples (format réel actuel de
// analyse_dce) ET les objets {label, detail} au cas où le backend enrichirait le
// format plus tard. Utilisé par les deux variantes d'affichage ci-dessous.
function itemTitle(item) {
  if (typeof item !== "object" || item === null) return item;
  return item.label || item.nom || item.critere || "Élément";
}
function itemDetail(item) {
  if (typeof item !== "object" || item === null) return null;
  return item.detail || item.explication || item.sous_criteres || item.ponderation || null;
}

// Mini-cartes en grille : pour les listes d'items courts (compétences, technologies,
// livrables...) — plus lisible qu'une pile verticale quand chaque item tient sur 1-2 lignes.
function ChipGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start", background: C.paper,
          border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 11px",
        }}>
          <CheckCircle2 size={13} color={C.success} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, lineHeight: 1.45, fontWeight: itemDetail(item) ? 600 : 500 }}>
              {itemTitle(item)}
            </div>
            {itemDetail(item) && (
              <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.mute, lineHeight: 1.4, marginTop: 2 }}>
                {itemDetail(item)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Liste verticale aérée : pour les items longs (pièces administratives, contraintes,
// points de vigilance, recommandations...) où une grille tasserait le texte.
function TextList({ items, tone = "default" }) {
  const toneMap = {
    default: { Icon: CheckCircle2, color: C.success },
    warning: { Icon: AlertTriangle, color: C.warning },
    tip: { Icon: Lightbulb, color: C.accent },
  };
  const { Icon, color } = toneMap[tone] || toneMap.default;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon size={15} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, color: C.ink, lineHeight: 1.55, fontWeight: itemDetail(item) ? 600 : 400 }}>
              {itemTitle(item)}
            </div>
            {itemDetail(item) && (
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, lineHeight: 1.5, marginTop: 3 }}>
                {itemDetail(item)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Section repliable réutilisable : header cliquable (icône + titre + badge de compte),
// contenu masquable. Fournit la hiérarchie/structure demandée sans complexifier chaque
// section individuellement.
function Section({ icon: Icon, label, count, defaultOpen = true, tone, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const bg = tone === "warning" ? "#FFFBF2" : tone === "tip" ? "#F6FAF7" : C.card;
  const border = tone === "warning" ? "#F0E0BD" : tone === "tip" ? "#DCEBDF" : C.line;

  return (
    <div style={{ border: `1px solid ${border}`, background: bg, borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: C.ink }}>
          <Icon size={15} color={C.accent} /> {label}
          {typeof count === "number" && (
            <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.mute, background: C.paper, padding: "1px 8px", borderRadius: 20, border: `1px solid ${C.line}` }}>
              {count}
            </span>
          )}
        </span>
        <ChevronDown size={15} color={C.faint} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

export default function AnalyseDcePanel({ appelOffresId, urlCps, readOnly = false }) {
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

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color={C.accent} /> Analyse du Dossier de Consultation
        </h2>
        {phase === "done" && <Badge status={analyse.statut} />}
      </div>

      {/* a) Pas encore traité */}
      {phase === "not_started" && readOnly && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontFamily: FONT, fontSize: 14, color: C.faint, margin: 0 }}>
            Aucune analyse migrée pour ce projet.
          </p>
        </div>
      )}
      {phase === "not_started" && !readOnly && (
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
               Veuillez d'abord télécharger le dossier de consultation ci-dessus.
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
              {/* Résumé exécutif — toujours visible, jamais replié : c'est le point d'entrée */}
              {analyse.resume && (
                <div style={{ marginBottom: 20, background: "#F8FAFC", borderLeft: `4px solid ${C.accent}`, padding: "16px 20px", borderRadius: "0 8px 8px 0" }}>
                  <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.faint, textTransform: "uppercase", margin: "0 0 10px", letterSpacing: 0.5 }}>
                    Résumé exécutif
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {analyse.resume}
                  </p>
                </div>
              )}

              {/* Budget + délai clé — bandeau toujours visible, hors sections repliables */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, fontSize: 13.5, color: C.mute, background: C.paper, padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                  <Wallet size={17} color={C.accent} />
                  <span><span style={{ fontWeight: 600, color: C.ink }}>Budget : </span>{analyse.budget || "Non précisé"}</span>
                </div>
                {analyse.nb_documents_analyses > 0 && (
                  <button onClick={openDocuments} style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 10, fontFamily: FONT, fontSize: 13.5, color: C.mute, background: C.paper, padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.line}`, cursor: "pointer", textAlign: "left" }}>
                    <FileStack size={17} color={C.accent} />
                    <span><span style={{ fontWeight: 600, color: C.ink }}>{analyse.nb_documents_analyses}</span> document(s) analysé(s)</span>
                  </button>
                )}
              </div>

              {/* Objet du marché */}
              {analyse.objet_marche && (
                <Section icon={FileText} label="Objet du marché" defaultOpen>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                    {analyse.objet_marche}
                  </p>
                </Section>
              )}

              {/* Délais importants — table, toujours ouverte : information opérationnelle critique */}
              {analyse.delais_importants?.length > 0 && (
                <Section icon={Clock} label="Délais importants" count={analyse.delais_importants.length} defaultOpen>
                  <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                    {analyse.delais_importants.map((d, i) => {
                      const libelle = typeof d === "string" ? d : (d.libelle || d);
                      const date = typeof d === "string" ? "Date non précisée" : (d.date || "Date non précisée");
                      return (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px",
                          borderTop: i > 0 ? `1px solid ${C.line}` : "none", fontFamily: FONT, fontSize: 13,
                          background: i % 2 === 0 ? "transparent" : C.paper,
                        }}>
                          <span style={{ color: C.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                            <ChevronRight size={13} color={C.mute} /> {libelle}
                          </span>
                          <span style={{ color: C.accent, fontWeight: 600, fontSize: 12, background: C.accentLt, padding: "3px 9px", borderRadius: 20, flexShrink: 0, marginLeft: 12 }}>
                            {date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Pièces administratives — clé pour le dossier de candidature, ouverte par défaut */}
              {analyse.pieces_administratives?.length > 0 && (
                <Section icon={ClipboardList} label="Pièces administratives requises" count={analyse.pieces_administratives.length} defaultOpen>
                  <TextList items={analyse.pieces_administratives} />
                </Section>
              )}

              {/* Prestations attendues */}
              {analyse.prestations_attendues?.length > 0 && (
                <Section icon={Target} label="Prestations attendues" count={analyse.prestations_attendues.length} defaultOpen>
                  <TextList items={analyse.prestations_attendues} />
                </Section>
              )}

              {/* Compétences & technologies — items courts, en grille */}
              {analyse.competences_recherchees?.length > 0 && (
                <Section icon={ListChecks} label="Compétences et exigences techniques" count={analyse.competences_recherchees.length} defaultOpen>
                  <ChipGrid items={analyse.competences_recherchees} />
                </Section>
              )}

              {analyse.technologies_mentionnees?.length > 0 && (
                <Section icon={Cpu} label="Technologies ou méthodes mentionnées" count={analyse.technologies_mentionnees.length}>
                  <ChipGrid items={analyse.technologies_mentionnees} />
                </Section>
              )}

              {analyse.livrables_attendus?.length > 0 && (
                <Section icon={FileStack} label="Livrables attendus" count={analyse.livrables_attendus.length}>
                  <ChipGrid items={analyse.livrables_attendus} />
                </Section>
              )}

              {analyse.criteres_evaluation?.length > 0 && (
                <Section icon={ListChecks} label="Critères d'évaluation" count={analyse.criteres_evaluation.length}>
                  <TextList items={analyse.criteres_evaluation} />
                </Section>
              )}

              {/* Contraintes / vigilance / recommandations — repliées par défaut, secondaires
                  à la première lecture mais accessibles en un clic */}
              {analyse.contraintes_importantes?.length > 0 && (
                <Section icon={AlertTriangle} label="Contraintes importantes" count={analyse.contraintes_importantes.length} defaultOpen={false} tone="warning">
                  <TextList items={analyse.contraintes_importantes} tone="warning" />
                </Section>
              )}

              {analyse.points_vigilance?.length > 0 && (
                <Section icon={ShieldAlert} label="Points de vigilance" count={analyse.points_vigilance.length} defaultOpen={false} tone="warning">
                  <TextList items={analyse.points_vigilance} tone="warning" />
                </Section>
              )}

              {analyse.recommandations?.length > 0 && (
                <Section icon={Lightbulb} label="Recommandations" count={analyse.recommandations.length} defaultOpen={false} tone="tip">
                  <TextList items={analyse.recommandations} tone="tip" />
                </Section>
              )}
            </>
          )}

          {/* Footer du panneau */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 16, marginTop: 4, borderTop: `1px solid ${C.line}` }}>
            <button onClick={openDocuments} style={linkBtnSm}>
              <FileStack size={14} /> Voir le détail des {analyse.nb_documents_analyses || 0} document(s) analysé(s)
            </button>
            {!readOnly && (
              <button onClick={handleLancer} disabled={triggering} style={secondaryBtnSm}>
                <RotateCcw size={14} /> {triggering ? "Relance…" : "Relancer l'analyse"}
              </button>
            )}
          </div>
        </div>
      )}

      {docsOpen && (
        <DocumentsDceModal documents={docs} loading={docsLoading} appelOffresId={appelOffresId} onClose={() => setDocsOpen(false)} />
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