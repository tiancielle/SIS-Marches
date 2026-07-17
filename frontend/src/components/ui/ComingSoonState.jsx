// État "à venir" réutilisable pour les modules dont le backend n'est pas encore spécifié
// (Factures, Paiements, Administration...). Le but : ne jamais montrer un simple texte
// "à venir" flottant dans le vide — même un écran vide doit donner confiance dans le produit.
// Volontairement : pas de fausses données, pas de tableau simulé — seulement une présentation
// claire de ce qui arrive, pour ne pas laisser croire que le module est déjà fonctionnel.
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../styles/theme";

export default function ComingSoonState({ icon: Icon, title, description, features = [], relatedLinks = [] }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
      padding: "56px 40px", textAlign: "center", maxWidth: 640, margin: "0 auto",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%", background: C.paper, border: `1px solid ${C.line}`,
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: C.accent,
      }}>
        <Icon size={21} strokeWidth={1.75} />
      </div>

      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
        {title}
      </div>
      <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.mute, lineHeight: 1.6, maxWidth: 440, margin: "0 auto 28px" }}>
        {description}
      </p>

      {features.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 10, textAlign: "left",
          background: C.paper, border: `1px solid ${C.line}`, borderRadius: C.radius,
          padding: "18px 22px", marginBottom: relatedLinks.length > 0 ? 24 : 0,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
            Au programme
          </div>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ color: C.faint, fontSize: 13, lineHeight: "20px" }}>●</span>
              <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {relatedLinks.length > 0 && (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {relatedLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                color: C.accent, background: C.accentLt, borderRadius: C.radius, padding: "9px 14px", textDecoration: "none",
              }}
            >
              {l.label} <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}