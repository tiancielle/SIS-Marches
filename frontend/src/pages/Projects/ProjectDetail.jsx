import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2, MapPin, Wallet, CalendarRange, User, Users } from "lucide-react";
import { useData } from "../../context/DataContext";
import { fmt, fmtDate } from "../../lib/mockData";
import Badge from "../../components/ui/Badge";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { C, FONT } from "../../styles/theme";

import ProjectInfoTab from "./tabs/ProjectInfoTab";
import ProjectInfoEdit from "./tabs/ProjectInfoEdit";
import ProjectSubsTab from "./tabs/ProjectSubsTab";
import ProjectDCETab from "./tabs/ProjectDCETab"; 
import ProjectHistoryTab from "./tabs/ProjectHistoryTab";

const TABS = [
  { key: "infos", label: "Infos générales" },
  { key: "subs", label: "Sous-traitants" },
  { key: "dce", label: "DCE" },
  { key: "historique", label: "Historique" },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject, getEquipeForProject } = useData();
  const [tab, setTab] = useState("infos");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const project = projects.find((p) => String(p.id) === id);
  if (!project) return <div style={{ padding: 32, color: C.faint }}>Projet introuvable.</div>;

  const equipeNames = getEquipeForProject(project.id).map((m) => m.nom).join(", ") || "Aucun membre affecté";

  const startEditing = () => { setTab("infos"); setEditing(true); };

  const handleSave = async (data) => {
    await updateProject(project.id, data);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate("/projects");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ padding: "18px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          <Link to="/projects" style={{ color: C.faint, textDecoration: "none" }}>Projets</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{project.nom}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{project.nom}</h1>
            <div style={{ marginTop: 6 }}><Badge status={project.statut} /></div>
          </div>

          {!editing && (
            <div style={{ display: "flex", gap: 8 }}>
              <button style={iconBtnStyle} onClick={startEditing}>
                <Pencil size={14} /> Modifier
              </button>
              <button style={{ ...iconBtnStyle, color: C.danger }} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 16, padding: "12px 16px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, flexWrap: "wrap" }}>
          <SummaryItem icon={MapPin} value={project.lieu} />
          <SummaryItem icon={User} value={project.chef} />
          <SummaryItem icon={Wallet} value={fmt(project.budget)} />
          <SummaryItem icon={CalendarRange} value={`${fmtDate(project.debut)} → ${fmtDate(project.fin)}`} />
          <SummaryItem icon={Users} value={equipeNames} />
        </div>

        {!editing && (
          <div style={{ display: "flex", gap: 4, marginTop: 18 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "8px 14px",
                  border: "none", cursor: "pointer", background: "transparent",
                  color: tab === t.key ? C.ink : C.mute,
                  borderBottom: tab === t.key ? `2px solid ${C.accent}` : "2px solid transparent",
                  transition: "color 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4 }} />

      <div key={editing ? "edit" : tab} style={{ padding: 32, animation: "fadeIn 0.18s ease" }}>
        {editing ? (
          <ProjectInfoEdit project={project} onSave={handleSave} onCancel={() => setEditing(false)} />
        ) : (
          <>
            {tab === "infos" && <ProjectInfoTab project={project} />}
            {tab === "subs" && <ProjectSubsTab projectId={project.id} />}
            {tab === "dce" && <ProjectDCETab projectId={project.id} />}
            {tab === "historique" && <ProjectHistoryTab projectId={project.id} />}
          </>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer ce projet ?"
          message={`Voulez-vous vraiment supprimer "${project.nom}" ? Cette action est irréversible.`}
          confirmLabel={deleting ? "Suppression…" : "Supprimer"}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function SummaryItem({ icon: Icon, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Icon size={14} color={C.mute} />
      <span style={{ fontFamily: FONT, fontSize: 13, color: C.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const iconBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 13,
  fontWeight: 600, color: C.mute, background: C.card, border: `1px solid ${C.line}`,
  borderRadius: 6, padding: "7px 12px", cursor: "pointer",
};