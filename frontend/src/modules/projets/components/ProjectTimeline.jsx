import React from "react";
import { Clock, FileText, Users, Briefcase, CheckCircle, AlertCircle, Sparkles, Archive, Edit, Trash2, Plus } from "lucide-react";
import { C, FONT } from "../../../styles/theme";
import { fmtDate } from "../../../lib/mockData";

export default function ProjectTimeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: FONT, fontSize: 14, color: C.mute }}>
        Aucun événement enregistré
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ position: "relative", paddingLeft: 20 }}>
        {/* Ligne verticale */}
        <div style={{
          position: "absolute",
          left: 7,
          top: 0,
          bottom: 0,
          width: 2,
          background: C.line,
        }} />

        {events.map((event, index) => (
          <TimelineEvent key={index} event={event} isLast={index === events.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ event, isLast }) {
  const iconMap = {
    creation: Briefcase,
    statut: CheckCircle,
    modification: Edit,
    suppression: Trash2,
    ajout: Plus,
    dce: FileText,
    equipe: Users,
    contrat: Archive,
    document: FileText,
    ia: Sparkles,
    ppt: Sparkles,
    ocr: FileText,
    sous_traitant: Users,
    alerte: AlertCircle,
  };

  const Icon = iconMap[event.type] || Clock;

  return (
    <div style={{ position: "relative", paddingBottom: isLast ? 0 : 24 }}>
      {/* Point sur la ligne */}
      <div style={{
        position: "absolute",
        left: -20,
        top: 0,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: C.card,
        border: `2px solid ${C.accent}`,
        zIndex: 1,
      }} />

      <div style={{ marginLeft: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon size={16} color={C.accent} />
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink }}>
            {event.title}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
            {event.date ? fmtDate(event.date) : ""}
          </span>
        </div>
        {event.description && (
          <p style={{ fontFamily: FONT, fontSize: 13, color: C.mute, margin: "0 0 4px" }}>
            {event.description}
          </p>
        )}
        {event.metadata && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(event.metadata).map(([key, value]) => (
              <span key={key} style={{
                fontFamily: FONT, fontSize: 11,
                padding: "2px 8px",
                background: C.paper,
                borderRadius: 4,
                color: C.mute,
              }}>
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
