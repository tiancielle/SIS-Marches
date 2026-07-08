import React from "react";
import { useData } from "../../../context/DataContext";
import { fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";

export default function ProjectHistoryTab({ projectId }) {
  const { getHistoryForProject } = useData();
  const events = getHistoryForProject(projectId);

  if (events.length === 0) return <div style={{ color: C.faint, fontFamily: FONT, fontSize: 13.5 }}>Aucun historique pour ce projet.</div>;

  return (
    <div style={{ position: "relative", paddingLeft: 8 }}>
      <div style={{ position: "absolute", left: 15, top: 6, bottom: 6, width: 1, background: C.line }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {events.map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 16, position: "relative" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent, marginTop: 4, flexShrink: 0, zIndex: 1, boxShadow: `0 0 0 3px ${C.card}` }} />
            <div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.faint, marginBottom: 2 }}>{fmtDate(e.date)}</div>
              <div style={{ fontFamily: FONT, fontSize: 14, color: C.ink, fontWeight: 600 }}>{e.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{e.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}