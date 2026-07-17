// Carte d'alertes — la seule zone du dashboard qui a le droit d'être "rouge".
// Le reste de l'UI reste sobre pour que ces signaux ressortent vraiment quand ils apparaissent.
import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileWarning, ShieldCheck } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";
import { fmtDate } from "../../../lib/mockData";

export default function AlertsPanel({ marches, contrats, dceList }) {
  const navigate = useNavigate();
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in14Days = new Date();
  in14Days.setDate(in14Days.getDate() + 14);

  const marchesUrgents = marches.filter(
    (m) => m.statut === "nouveau" && m.date_limite_remise && new Date(m.date_limite_remise) >= now && new Date(m.date_limite_remise) <= in7Days
  );

  const contratsExpirant = contrats.filter(
    (c) => c.date_fin && new Date(c.date_fin) >= now && new Date(c.date_fin) <= in14Days
  );

  const dceIncomplets = dceList.filter((d) => !d.document_nom);

  const alerts = [
    ...marchesUrgents.map((m) => ({
      key: `mu-${m.id}`, icon: AlertTriangle,
      text: `Remise dans ${Math.ceil((new Date(m.date_limite_remise) - now) / 86400000)} j — ${m.reference}`,
      onClick: () => navigate(`/marches/${m.id}`),
    })),
    ...contratsExpirant.map((c) => ({
      key: `ce-${c.id}`, icon: FileWarning,
      text: `Contrat ${c.reference || `#${c.id}`} arrive à échéance le ${fmtDate(c.date_fin)}`,
      onClick: () => navigate(`/contrats/${c.id}`),
    })),
    ...dceIncomplets.map((d) => ({
      key: `dce-${d.id}`, icon: FileWarning,
      text: `Document manquant sur le dossier "${(d.objet || "").slice(0, 40)}"`,
      onClick: () => navigate(`/projects/${d.projet_id}`),
    })),
  ].slice(0, 5);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "20px 22px" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, margin: "0 0 14px" }}>
        Alertes
      </h2>

      {alerts.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 12.5, color: C.success }}>
          <ShieldCheck size={15} strokeWidth={1.75} /> Tout est sous contrôle.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {alerts.map((a) => (
            <div
              key={a.key}
              onClick={a.onClick}
              style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 6px", borderRadius: 7, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.paper)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <a.icon size={14} strokeWidth={1.75} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: FONT, fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
