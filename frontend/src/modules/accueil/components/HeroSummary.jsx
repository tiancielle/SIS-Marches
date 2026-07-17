// Carte de bienvenue — première chose vue après connexion.
// Doit répondre en une phrase à "s'est-il passé quelque chose depuis ma dernière visite ?"
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

const TODAY_LABEL = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function HeroSummary({ firstName, newCount, urgentCount, lastSync }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.accent} 0%, #1B2A38 100%)`,
        borderRadius: C.radius,
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
        boxShadow: C.shadow,
      }}
    >
      <div style={{ minWidth: 260 }}>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "rgba(255,255,255,0.55)", textTransform: "capitalize", marginBottom: 6 }}>
          {TODAY_LABEL}
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: "#fff", margin: 0, marginBottom: 10 }}>
          {getGreeting()}, {firstName}.
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "rgba(255,255,255,0.72)", margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
          {newCount > 0 ? (
            <>
              <strong style={{ color: "#fff" }}>{newCount} nouveau{newCount > 1 ? "x" : ""} marché{newCount > 1 ? "s" : ""}</strong> détecté{newCount > 1 ? "s" : ""} depuis votre dernière visite
              {urgentCount > 0 && (
                <>, dont <strong style={{ color: "#fff" }}>{urgentCount}</strong> à échéance proche</>
              )}
              .
            </>
          ) : (
            "Aucun nouveau marché depuis votre dernière visite — la veille tourne en arrière-plan."
          )}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontFamily: FONT, fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>
          <RefreshCw size={12} />
          Dernière synchronisation {lastSync}
        </div>
      </div>

      <button
        onClick={() => navigate("/marches")}
        style={{
          display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
          color: C.accent, background: "#fff", border: "none", borderRadius: C.radius,
          padding: "11px 18px", cursor: "pointer", flexShrink: 0,
        }}
      >
        Voir les nouveaux marchés <ArrowUpRight size={15} />
      </button>
    </div>
  );
}
