import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2, MapPin, Wallet, CalendarRange, User, Users } from "lucide-react";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { getPhase } from "../../../lib/phases";
import Badge from "../../../components/ui/Badge";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import { C, FONT } from "../../../styles/theme";
import ProjectInfoEdit from "./tabs/ProjectInfoEdit";

// Coquille commune Opportunité / Projet : header, breadcrumb, résumé, changement de
// statut (ce qui déclenche la "migration" Opportunité → Projet, qui n'est qu'un
// changement de statut sur la même entité — voir lib/phases.js), onglets, édition,
// suppression. Chaque appelant fournit sa liste d'onglets et son rendu de contenu.
export default function ProjectDetailShell({ project, tabs, backTo, backLabel, statutOptions, deleteRedirectTo, renderTab }) {
  const navigate = useNavigate();
  const { updateProject, deleteProject, getEquipeForProject } = useData();
  const [tab, setTab] = useState(tabs[0]?.key);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changingStatut, setChangingStatut] = useState(false);

  const equipeNames = getEquipeForProject(project.id).map((m) => m.nom).join(", ") || "Aucun membre affecté";

  const startEditing = () => { setTab(tabs[0]?.key); setEditing(true); };

  const handleSave = async (data) => {
    await updateProject(project.id, data);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate(deleteRedirectTo);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatutChange = async (e) => {
    const nouveauStatut = e.target.value;
    setChangingStatut(true);
    try {
      await updateProject(project.id, { ...project, statut: nouveauStatut });
      // Si le changement de statut fait passer l'objet dans l'autre phase (ex.
      // Opportunité → Gagnée), on redirige vers la bonne liste : la fiche actuelle
      // n'a plus lieu d'être affichée dans ce module.
      const nouvellePhase = getPhase(nouveauStatut);
      const pheseActuelle = getPhase(project.statut);
      if (nouvellePhase !== pheseActuelle) {
        navigate(nouvellePhase === "projet" ? `/projects/${project.id}` : `/opportunites/${project.id}`, { replace: true });
      }
    } finally {
      setChangingStatut(false);
    }
  };

  return (
    <div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ padding: "18px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, color: C.faint, marginBottom: 12 }}>
          <Link to={backTo} style={{ color: C.faint, textDecoration: "none" }}>{backLabel}</Link>
          <ChevronRight size={12} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{project.nom}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, margin: 0 }}>{project.nom}</h1>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Badge status={project.statut} />
              {statutOptions?.length > 0 && (
                <select
                  value={project.statut}
                  onChange={handleStatutChange}
                  disabled={changingStatut}
                  style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.mute, background: C.card,
                    border: `1px solid ${C.line}`, borderRadius: 20, padding: "3px 10px", cursor: changingStatut ? "default" : "pointer",
                  }}
                >
                  {statutOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
            </div>
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

        <div style={{ display: "flex", gap: 24, marginTop: 16, padding: "12px 16px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: C.radius, flexWrap: "wrap" }}>
          <SummaryItem icon={MapPin} value={project.lieu} />
          <SummaryItem icon={User} value={project.chef} />
          <SummaryItem icon={Wallet} value={fmt(project.budget)} />
          <SummaryItem icon={CalendarRange} value={`${fmtDate(project.debut)} → ${fmtDate(project.fin)}`} />
          <SummaryItem icon={Users} value={equipeNames} />
        </div>

        {!editing && (
          <div style={{ display: "flex", gap: 4, marginTop: 18, flexWrap: "wrap", background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 4, width: "fit-content" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "7px 14px",
                  border: "none", cursor: "pointer", borderRadius: 8,
                  color: tab === t.key ? "#fff" : C.mute,
                  background: tab === t.key ? C.accent : "transparent",
                  transition: "background 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 20 }} />

      <div key={editing ? "edit" : tab} style={{ padding: 32, animation: "fadeIn 0.18s ease" }}>
        {editing ? (
          <ProjectInfoEdit project={project} onSave={handleSave} onCancel={() => setEditing(false)} />
        ) : (
          renderTab(tab)
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
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
  borderRadius: C.radius, padding: "7px 12px", cursor: "pointer",
};