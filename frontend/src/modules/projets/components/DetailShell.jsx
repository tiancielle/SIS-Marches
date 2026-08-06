import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Pencil, Trash2, MapPin, Wallet, CalendarRange, User, Users } from "lucide-react";
import { fmt, fmtDate } from "../../../lib/mockData";
import Badge from "../../../components/ui/Badge";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import { C, FONT } from "../../../styles/theme";

export default function DetailShell({
  project,
  tabs,
  backTo,
  backLabel,
  deleteRedirectTo,
  statutOptions,
  editing,
  onEdit,
  onDelete,
  onSave,
  onStatutChange,
  renderTab,
}) {
  const [tab, setTab] = React.useState("infos");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [currentStatut, setCurrentStatut] = React.useState(project.statut);

  const equipeNames = project.equipeNames || "Aucun membre affecté";

  const handleStatutChange = async (newStatut) => {
    setCurrentStatut(newStatut);
    if (onStatutChange) {
      await onStatutChange(newStatut);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (onDelete) await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  // Mettre à jour currentStatut quand project.statut change
  React.useEffect(() => {
    setCurrentStatut(project.statut);
  }, [project.statut]);

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
            <div style={{ marginTop: 6 }}><Badge status={currentStatut} /></div>
          </div>

          {!editing && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {statutOptions && statutOptions.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {statutOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatutChange(opt.value)}
                      disabled={currentStatut === opt.value}
                      style={{
                        fontFamily: FONT, fontSize: 12.5, fontWeight: 500,
                        padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: currentStatut === opt.value ? C.accent : C.card,
                        color: currentStatut === opt.value ? "#fff" : C.ink,
                        border: currentStatut === opt.value ? "none" : `1px solid ${C.line}`,
                        opacity: currentStatut === opt.value ? 1 : 0.8,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (currentStatut !== opt.value) {
                          e.target.style.background = C.paper;
                          e.target.style.borderColor = C.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentStatut !== opt.value) {
                          e.target.style.background = C.card;
                          e.target.style.borderColor = C.line;
                        }
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button style={iconBtnStyle} onClick={onEdit}>
                <Pencil size={14} /> Modifier
              </button>
              <button style={{ ...iconBtnStyle, color: C.danger }} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 16, padding: "12px 16px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: C.radius, flexWrap: "wrap" }}>
          <SummaryItem icon={User} value={project.chef || "Non assigné"} />
          <SummaryItem icon={Wallet} value={project.budget ? `${project.budget.toLocaleString()} MAD` : "—"} />
          <SummaryItem icon={CalendarRange} value={fmtDate(project.fin) || "—"} />
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
        {renderTab(tab)}
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
  borderRadius: C.radius, padding: "7px 12px", cursor: "pointer",
};
