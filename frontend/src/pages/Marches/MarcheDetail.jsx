import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { useData } from "../../context/DataContext";
import { fmt, fmtDate } from "../../lib/mockData";
import Badge from "../../components/ui/Badge";
import { C, FONT } from "../../styles/theme";

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}`, gap: 16 }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

export default function MarcheDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { marches, getAnalyseForMarche, analyserMarche, selectMarche, ignoreMarche } = useData();
  const [analysing, setAnalysing] = useState(false);
  const [converting, setConverting] = useState(false);

  const marche = marches.find((m) => String(m.id) === id);
  if (!marche) return <div style={{ padding: 32, color: C.faint }}>Marché introuvable.</div>;

  const analyse = getAnalyseForMarche(marche.id);

  const handleAnalyser = async () => { setAnalysing(true); try { await analyserMarche(marche.id); } finally { setAnalysing(false); } };
  const handleSelect = async () => { setConverting(true); try { const pid = await selectMarche(marche.id); navigate(`/projects/${pid}`); } finally { setConverting(false); } };

  return (
    <div>
      <div style={{ padding: "18px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          <Link to="/marches" style={{ color: C.faint, textDecoration: "none" }}>Marchés publics</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{marche.reference}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, maxWidth: 640 }}>{marche.objet}</h1>
            <div style={{ marginTop: 6 }}><Badge status={marche.statut} /></div>
          </div>

          {marche.statut !== "converti" && marche.statut !== "ignore" && (
            <div style={{ display: "flex", gap: 8 }}>
              {!analyse && (
                <button onClick={handleAnalyser} disabled={analysing} style={btnAccent}>
                  <Sparkles size={14} /> {analysing ? "Analyse en cours…" : "Analyser"}
                </button>
              )}
              <button onClick={handleSelect} disabled={converting} style={btnPrimary}>
                {converting ? "…" : "Sélectionner → créer le projet"}
              </button>
              <button onClick={() => ignoreMarche(marche.id)} style={btnGhost}>Ignorer</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16 }} />

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px", maxWidth: 560 }}>
          <Row label="Organisme" value={marche.organisme} />
          <Row label="Montant estimatif" value={marche.montant_estimatif ? fmt(marche.montant_estimatif) : null} />
          <Row label="Date limite" value={marche.date_limite_remise ? fmtDate(marche.date_limite_remise) : null} />
          <Row label="Type de procédure" value={marche.type_procedure} />
          {marche.url_avis && (
            <div style={{ padding: "11px 0" }}>
              <a href={marche.url_avis} target="_blank" rel="noreferrer" style={{ color: C.accent, fontFamily: FONT, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                Voir l'avis officiel <ExternalLink size={12} />
              </a>
            </div>
          )}
          {marche.url_cps && (
            <div style={{ padding: "11px 0" }}>
              <a href={marche.url_cps} target="_blank" rel="noreferrer" style={{ color: C.accent, fontFamily: FONT, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                Voir le CPS <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {analyse && (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px", maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.ink }}>Analyse IA</span>
              <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: analyse.score_pertinence >= 60 ? C.success : C.mute }}>{analyse.score_pertinence}/100</span>
            </div>
            <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, marginTop: 0 }}>{analyse.resume}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
              {analyse.mots_cles.map((k) => (
                <span key={k} style={{ fontFamily: FONT, fontSize: 11.5, color: C.mute, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 4, padding: "2px 8px" }}>{k}</span>
              ))}
            </div>
            <Row label="Justification" value={analyse.justification} />
            <Row label="Recommandations" value={analyse.recommandations} />
          </div>
        )}
      </div>
    </div>
  );
}

const btnGhost = { display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.mute, background: C.card, border: `1px solid ${C.line}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" };
const btnAccent = { ...btnGhost, color: C.accent, background: C.accentLt, border: "none" };
const btnPrimary = { ...btnGhost, color: "#fff", background: C.accent, border: "none" };