import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2, MapPin, Wallet, CalendarRange, User, Users } from "lucide-react";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import { C, FONT } from "../../../styles/theme";
import { getWorkflowState } from "../lib/workflow";
import { TRANSITIONS_PAR_STATUT } from "../lib/tabsConfig";
import DetailShell from "../components/DetailShell";
import InfoEdit from "../components/tabs/InfoEdit";
import InfoTab from "../components/tabs/InfoTab";
import ContratsTab from "../components/tabs/ContratsTab";
// Import des composants existants
import ProjectDCETab from "./tabs/ProjectDCETab";
import ProjectCandidatureTab from "./tabs/ProjectCandidatureTab";
import ProjectSubsTab from "./tabs/ProjectSubsTab";
import ProjectEquipeTab from "./tabs/ProjectEquipeTab";
import ProjectDocsTab from "./tabs/ProjectDocsTab";
import ProjectHistoryTab from "./tabs/ProjectHistoryTab";
import DocumentsDceList from "../../veille/pages/DocumentsDceList";
import { fetchDocumentsDce } from "../../../services/analyseDce";

export default function ProjetDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, getEquipeForProject, changeProjectStatut } = useData();
  const [tab, setTab] = useState("infos");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const project = projects.find((p) => String(p.id) === id);
  if (!project) return <div style={{ padding: 32, color: C.faint }}>Projet introuvable.</div>;

  const workflowState = getWorkflowState(project.statut);
  const equipe = getEquipeForProject(project.id);
  const equipeNames = equipe.map((m) => m.nom).join(", ") || "Aucun membre affecté";

  // Charger les documents DCE si appel_offres_id existe
  useEffect(() => {
    if (project?.appel_offres_id) {
      setLoading(true);
      fetchDocumentsDce(project.appel_offres_id)
        .then(setDocuments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [project?.appel_offres_id]);

  // Configuration des onglets selon le workflow_state
  const tabs = workflowState === "opportunite" ? [
    { key: "infos", label: "Informations", component: InfoTab },
    { key: "dce", label: "DCE", component: ProjectDCETab },
    { key: "documents", label: "Documents", component: null },
    { key: "candidature", label: "Candidature", component: ProjectCandidatureTab },
    { key: "historique", label: "Historique", component: ProjectHistoryTab },
  ] : [
    { key: "infos", label: "Informations", component: InfoTab },
    { key: "equipe", label: "Équipe", component: ProjectEquipeTab },
    { key: "subs", label: "Sous-traitants", component: ProjectSubsTab },
    { key: "docs", label: "Documents", component: ProjectDocsTab },
    { key: "contrats", label: "Contrats", component: ContratsTab },
    { key: "historique", label: "Historique", component: ProjectHistoryTab },
  ];

  const statutOptions = TRANSITIONS_PAR_STATUT[project.statut] || [];

  const startEditing = () => { setTab("infos"); setEditing(true); };

  const handleSave = async (data) => {
    await updateProject(project.id, data);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate(workflowState === "opportunite" ? "/opportunites" : "/projets");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatutChange = async (newStatut) => {
    // Réactivation d'un projet ignoré/abandonné
    if (newStatut === "interesse" && (project.statut === "ignore" || project.statut === "abandonne")) {
      await changeProjectStatut(project.id, "interesse");
    } else {
      await changeProjectStatut(project.id, newStatut);
    }
  };

  const backTo = workflowState === "opportunite" ? "/opportunites" : "/projets";
  const backLabel = workflowState === "opportunite" ? "Opportunités d'affaires" : "Projets en cours";

  const renderTab = (currentTab) => {
    if (editing && currentTab === "infos") {
      return <InfoEdit project={project} onSave={handleSave} onCancel={() => setEditing(false)} />;
    }
    
    // Cas spécial : onglet Documents pour les opportunités
    if (currentTab === "documents" && workflowState === "opportunite") {
      return (
        <div style={{ padding: 24 }}>
          {project.appel_offres_id ? (
            <DocumentsDceList 
              documents={documents}
              loading={loading}
              appelOffresId={project.appel_offres_id}
              emptyText="Aucun document disponible pour cette opportunité."
            />
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: C.faint }}>
              Cette opportunité n'a pas d'appel d'offres associé.
            </div>
          )}
        </div>
      );
    }
    
    // Onglets placeholders pour fonctionnalités futures
    if (currentTab === "zip" || currentTab === "ppt") {
      return (
        <div style={{ padding: 48, textAlign: "center", color: C.faint }}>
          Fonctionnalité bientôt disponible.
        </div>
      );
    }
    
    switch(currentTab) {
      case "infos":
        return <InfoTab project={project} />;
      case "dce":
        return <ProjectDCETab project={project} />;
      case "candidature":
        return <ProjectCandidatureTab project={project} />;
      case "subs":
        return <ProjectSubsTab projectId={project.id} />;
      case "equipe":
        return <ProjectEquipeTab projectId={project.id} />;
      case "docs":
        return <ProjectDocsTab project={project} />;
      case "historique":
        return <ProjectHistoryTab projectId={project.id} />;
      case "contrats":
        return <ContratsTab project={project} />;
      default:
        return null;
    }
  };

  return (
    <DetailShell
      project={project}
      tabs={tabs}
      backTo={backTo}
      backLabel={backLabel}
      deleteRedirectTo={backTo}
      statutOptions={statutOptions}
      editing={editing}
      onEdit={startEditing}
      onDelete={() => setConfirmDelete(true)}
      onSave={handleSave}
      onStatutChange={handleStatutChange}
      renderTab={renderTab}
    />
  );
}
