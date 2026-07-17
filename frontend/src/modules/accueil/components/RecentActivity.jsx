// Timeline d'activité — reprend le pattern visuel de ProjectHistoryTab (ligne verticale + points)
// pour rester cohérent avec le reste de l'app, mais fusionne plusieurs sources réelles :
// historique de projets, analyses IA effectuées, marchés importés.
import React from "react";
import { FileSearch, Sparkles, FolderKanban } from "lucide-react";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";
import { fmtDate } from "../../../lib/mockData";

export default function RecentActivity({ projects, getHistoryForProject, analyses, marches }) {
  const projectEvents = projects.flatMap((p) =>
    getHistoryForProject(p.id).map((e) => ({ ...e, icon: FolderKanban, key: `proj-${e.id}` }))
  );

  const analyseEvents = analyses.map((a) => {
    const marche = marches.find((m) => m.id === a.marche_public_id);
    return {
      key: `analyse-${a.id}`,
      date: a.date_analyse,
      label: "Marché analysé par l'IA",
      detail: marche ? `${marche.objet.slice(0, 70)}… · score ${a.score_pertinence}%` : `Score ${a.score_pertinence}%`,
      icon: Sparkles,
    };
  });

  const importEvents = marches.slice(0, 3).map((m) => ({
    key: `import-${m.id}`,
    date: m.date_import,
    label: "Marché importé",
    detail: `${m.reference} · ${m.organisme}`,
    icon: FileSearch,
  }));

  const events = [...projectEvents, ...analyseEvents, ...importEvents]
    .filter((e) => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "22px 24px" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink, margin: "0 0 16px" }}>
        Activité récente
      </h2>

      {events.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 13, color: C.faint, padding: "8px 0" }}>Aucune activité pour le moment.</div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 4 }}>
          <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 1, background: C.line }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {events.map((e) => (
              <div key={e.key} style={{ display: "flex", gap: 14, position: "relative" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: C.paper, border: `1px solid ${C.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, color: C.mute,
                }}>
                  <e.icon size={13} strokeWidth={1.75} />
                </div>
                <div style={{ paddingTop: 3 }}>
                  <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, marginBottom: 1 }}>{fmtDate(e.date)}</div>
                  <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{e.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.mute, marginTop: 1 }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
