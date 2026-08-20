import React, { useEffect, useRef, useState } from "react";
import { useData } from "../../../../store/DataContext";
import ProjectTimeline from "../../components/ProjectTimeline";
import { EVENT_TYPE_TO_PHASE, EVENT_PHASES } from "../../lib/eventHistory";
import { C, FONT } from "../../../../styles/theme";

export default function ProjectHistoryTab({ projectId }) {
  const { getHistoryForProject, fetchHistorique } = useData();
  const events = getHistoryForProject(projectId);
  const hasLoaded = useRef(false);
  const [filter, setFilter] = useState("all"); // "all", "candidature", "projet"

  // Charger l'historique depuis le backend au montage (une seule fois)
  useEffect(() => {
    if (!hasLoaded.current && projectId) {
      hasLoaded.current = true;
      fetchHistorique(projectId);
    }
  }, [projectId]);

  // Mapper les types d'événements eventHistory vers les types ProjectTimeline
  const typeMap = {
    opportunity_created: "creation",
    opportunity_interested: "statut",
    opportunity_in_preparation: "modification",
    opportunity_ready_to_submit: "statut",
    opportunity_submitted: "ajout",
    opportunity_won: "statut",
    opportunity_lost: "statut",
    opportunity_ignored: "suppression",
    opportunity_abandoned: "suppression",
    dce_downloaded: "dce",
    dce_analysis_completed: "ia",
    candidature_document_added: "ajout",
    project_created: "creation",
    project_updated: "modification",
    project_status_changed: "statut",
    project_deleted: "suppression",
    contract_created: "ajout",
    contract_updated: "modification",
    contract_deleted: "suppression",
    document_added: "ajout",
    document_downloaded: "document",
    team_member_assigned: "equipe",
    team_member_removed: "suppression",
    team_member_updated: "modification",
    subcontractor_assigned: "sous_traitant",
    subcontractor_removed: "suppression",
    subcontractor_updated: "modification",
    ppt_generated: "ppt",
  };

  // Filtrer les événements selon le filtre sélectionné
  const filteredEvents = events.filter(e => {
    if (filter === "all") return true;
    const eventType = e.metadata?.type || e.type;
    const phase = EVENT_TYPE_TO_PHASE[eventType];
    return phase === filter;
  });

  // Transformer les événements existants au format attendu par ProjectTimeline
  const timelineEvents = filteredEvents.map(e => {
    const eventType = e.metadata?.type || e.type;
    const mappedType = typeMap[eventType] || "creation";
    return {
      type: mappedType,
      title: e.label || e.titre || "Événement",
      description: e.detail || e.description || "",
      date: e.date,
      metadata: e.metadata || {},
    };
  });

  return (
    <div>
      {/* Filtres */}
      <div style={{ 
        display: "flex", 
        gap: 4, 
        background: C.card, 
        border: `1px solid ${C.line}`, 
        borderRadius: 8, 
        padding: 4,
        marginBottom: 20
      }}>
        {[
          { key: "all", label: "Tout" },
          { key: "candidature", label: "Candidature" },
          { key: "projet", label: "Projet" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "7px 14px",
              borderRadius: 6, border: "none", cursor: "pointer",
              color: filter === f.key ? "#fff" : C.mute,
              background: filter === f.key ? C.accent : "transparent",
              transition: "background 0.15s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ProjectTimeline events={timelineEvents} />
    </div>
  );
}