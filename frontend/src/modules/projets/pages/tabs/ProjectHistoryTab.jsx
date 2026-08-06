import React, { useEffect } from "react";
import { useData } from "../../../../store/DataContext";
import ProjectTimeline from "../../components/ProjectTimeline";

export default function ProjectHistoryTab({ projectId }) {
  const { getHistoryForProject, fetchHistorique } = useData();
  const events = getHistoryForProject(projectId);

  // Charger l'historique depuis le backend au montage
  useEffect(() => {
    fetchHistorique(projectId);
  }, [projectId, fetchHistorique]);

  // Transformer les événements existants au format attendu par ProjectTimeline
  const timelineEvents = events.map(e => ({
    type: e.type || "creation",
    title: e.label,
    description: e.detail,
    date: e.date,
    metadata: e.metadata || {},
  }));

  return <ProjectTimeline events={timelineEvents} />;
}