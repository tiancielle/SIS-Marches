// Regroupe toutes les échéances datées de l'app (marchés, contrats, projets) en une seule
// liste triée chronologiquement — évite d'avoir à checker 3 modules différents pour savoir
// "qu'est-ce qui arrive cette semaine".
import React from "react";
import { CalendarClock, FileCheck2, FolderKanban } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";
import { fmtDate } from "../../../lib/mockData";

export default function UpcomingEvents({ marches, contrats, projects }) {
  const now = new Date();

  const marcheEvents = marches
    .filter((m) => m.date_limite_remise && new Date(m.date_limite_remise) >= now)
    .map((m) => ({ key: `m-${m.id}`, date: m.date_limite_remise, label: "Remise d'offre", detail: m.organisme, icon: CalendarClock }));

  const contratEvents = contrats
    .filter((c) => c.date_fin && new Date(c.date_fin) >= now)
    .map((c) => ({ key: `c-${c.id}`, date: c.date_fin, label: "Fin de contrat", detail: c.reference || `Contrat #${c.id}`, icon: FileCheck2 }));

  const projectEvents = projects
    .filter((p) => p.statut === "actif" && p.fin && new Date(p.fin) >= now)
    .map((p) => ({ key: `p-${p.id}`, date: p.fin, label: "Livraison prévue", detail: p.nom, icon: FolderKanban }));

  const events = [...marcheEvents, ...contratEvents, ...projectEvents]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "20px 22px" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, margin: "0 0 14px" }}>
        Prochaines échéances
      </h2>

      {events.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.faint }}>Rien à l'horizon.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {events.map((e) => (
            <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
              <e.icon size={14} strokeWidth={1.75} color={C.faint} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.label}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.detail}
                </div>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: C.mute, flexShrink: 0 }}>
                {fmtDate(e.date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
