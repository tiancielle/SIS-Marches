import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useData } from "../../../store/DataContext";
import { getPhase } from "../../../lib/phases";
import { C } from "../../../styles/theme";

export default function LegacyProjectRedirect() {
  const { id } = useParams();
  const { projects } = useData();
  const project = projects.find((p) => String(p.id) === id);

  if (!project) return <div style={{ padding: 32, color: C.faint }}>Projet introuvable.</div>;

  const phase = getPhase(project.statut);
  return <Navigate to={phase === "projet" ? `/projets/${id}` : `/opportunites/${id}`} replace />;
}