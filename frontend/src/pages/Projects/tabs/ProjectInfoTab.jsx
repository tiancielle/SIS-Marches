import React from "react";
import { C, FONT } from "../../../styles/theme";
import { fmt, fmtDate } from "../../../lib/mockData";

function Row({ label, value, danger }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.mute }}>{label}</span>
      <span style={{ fontFamily: FONT, fontSize: 13.5, color: danger ? C.danger : C.ink, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function ProjectInfoTab({ project }) {
  const overBudget = project.budget_engage > project.budget;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px" }}>
        <Row label="Client" value={project.client} />
        <Row label="Lieu" value={project.lieu} />
        <Row label="Chef de projet" value={project.chef} />
        <Row label="Budget total" value={fmt(project.budget)} />
        <Row label="Budget engagé" value={fmt(project.budget_engage)} danger={overBudget} />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: "18px 22px" }}>
        <Row label="Début" value={fmtDate(project.debut)} />
        <Row label="Fin prévue" value={fmtDate(project.fin)} />
      </div>
    </div>
  );
}