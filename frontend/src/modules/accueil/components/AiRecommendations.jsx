// Section principale du dashboard — c'est elle qui doit donner envie d'utiliser l'IA.
// Combine des données réelles (scores d'analyse, marchés nouveaux, échéances) avec
// une recommandation stratégique de synthèse (simulée frontend, comme le reste des
// analyses IA du projet en attendant le vrai endpoint LLM — cf. store/DataContext).
import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, AlertTriangle, TrendingUp, Target } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";
import { fmt, fmtDate } from "../../../lib/mockData";

function RecoRow({ icon: Icon, tone, title, description, action, onClick }) {
  const toneColor = tone === "success" ? C.success : tone === "warning" ? C.warning : C.accent;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 14, padding: "14px 4px", borderBottom: `1px solid ${C.line}`,
        cursor: onClick ? "pointer" : "default", alignItems: "flex-start",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = C.accentLt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.line}`, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", color: toneColor, marginTop: 1,
      }}>
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, marginTop: 2, lineHeight: 1.5 }}>{description}</div>
      </div>
      {action && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 12, fontWeight: 600, color: toneColor, flexShrink: 0, marginTop: 6 }}>
          {action} <ArrowRight size={12} />
        </div>
      )}
    </div>
  );
}

export default function AiRecommendations({ marches, analyses }) {
  const navigate = useNavigate();

  const topAnalyse = [...analyses].sort((a, b) => b.score_pertinence - a.score_pertinence)[0];
  const topMarche = topAnalyse ? marches.find((m) => m.id === topAnalyse.marche_public_id) : null;

  const nouveaux = marches.filter((m) => m.statut === "nouveau").slice(0, 2);

  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const urgent = marches
    .filter((m) => m.date_limite_remise && new Date(m.date_limite_remise) >= now && new Date(m.date_limite_remise) <= in7Days)
    .sort((a, b) => new Date(a.date_limite_remise) - new Date(b.date_limite_remise))[0];

  const hasAnyReco = topMarche || nouveaux.length > 0 || urgent;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Sparkles size={16} color={C.accent} strokeWidth={1.75} />
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink, margin: 0 }}>
          Recommandations IA
        </h2>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12.5, color: C.faint, margin: "2px 0 8px" }}>
        Basées sur l'analyse de vos marchés et l'historique de votre activité
      </p>

      {!hasAnyReco && (
        <div style={{ padding: "24px 4px", fontFamily: FONT, fontSize: 13, color: C.faint }}>
          Aucune recommandation pour le moment — importez ou analysez des marchés pour activer l'IA.
        </div>
      )}

      {topMarche && (
        <RecoRow
          icon={Target}
          tone="success"
          title={`Ce marché correspond à votre activité à ${topAnalyse.score_pertinence}%`}
          description={topMarche.objet}
          action="Voir"
          onClick={() => navigate(`/marches/${topMarche.id}`)}
        />
      )}

      {nouveaux.length > 0 && (
        <RecoRow
          icon={Sparkles}
          tone="neutral"
          title={`${nouveaux.length} appel${nouveaux.length > 1 ? "s" : ""} d'offres prioritaire${nouveaux.length > 1 ? "s" : ""} à analyser`}
          description={nouveaux.map((m) => m.organisme).join(" · ")}
          action="Analyser"
          onClick={() => navigate("/marches")}
        />
      )}

      {urgent && (
        <RecoRow
          icon={AlertTriangle}
          tone="warning"
          title={`Échéance proche — remise avant le ${fmtDate(urgent.date_limite_remise)}`}
          description={`${urgent.objet}${urgent.montant_estimatif ? ` · ${fmt(urgent.montant_estimatif)}` : ""}`}
          action="Voir"
          onClick={() => navigate(`/marches/${urgent.id}`)}
        />
      )}

      <RecoRow
        icon={TrendingUp}
        tone="neutral"
        title="Recommandation stratégique"
        description="Les marchés liés à la digitalisation des services publics représentent une part croissante de votre pipeline — envisagez de renforcer votre veille sur ce segment."
      />
    </div>
  );
}

