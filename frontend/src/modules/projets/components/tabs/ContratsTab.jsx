import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { useData } from "../../../../store/DataContext";
import { fmt, fmtDate } from "../../../../lib/mockData";
import Badge from "../../../../components/ui/Badge";
import { C, FONT } from "../../../../styles/theme";

export default function ContratsTab({ project }) {
  const navigate = useNavigate();
  const { contrats, subs, addContrat } = useData();
  const [showForm, setShowForm] = React.useState(false);

  const contratsProjet = contrats.filter(c => c.projet_id === project.id);
  const nomSub = (id) => subs.find((s) => s.id === id)?.name || "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>
          Contrats liés ({contratsProjet.length})
        </h3>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
            padding: "8px 16px", borderRadius: C.radius,
            border: "none", background: C.accent, cursor: "pointer", color: "#fff"
          }}
        >
          <Plus size={16} />
          Nouveau contrat
        </button>
      </div>

      {contratsProjet.length === 0 ? (
        <div style={{ 
          background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, 
          padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint 
        }}>
          Aucun contrat lié à ce projet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {contratsProjet.map(contrat => (
            <div
              key={contrat.id}
              style={{
                background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
                padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <FileText size={16} color={C.mute} />
                  <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.ink }}>
                    {contrat.reference || "Sans référence"}
                  </span>
                  <Badge status={contrat.statut} />
                </div>
                <div style={{ display: "flex", gap: 20, fontFamily: FONT, fontSize: 12.5, color: C.mute }}>
                  <span>Sous-traitant: {nomSub(contrat.sous_traitant_id)}</span>
                  <span>Montant: {fmt(contrat.montant || 0)}</span>
                  <span>Échéance: {fmtDate(contrat.date_fin)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/contrats/${contrat.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
                  padding: "6px 12px", borderRadius: C.radius,
                  border: `1px solid ${C.line}`, background: C.paper,
                  cursor: "pointer", color: C.ink
                }}
              >
                Voir détails <ExternalLink size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ContratFormInline
          projectId={project.id}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            addContrat(data);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function ContratFormInline({ projectId, onClose, onSave }) {
  const { subs } = useData();
  const [formData, setFormData] = React.useState({
    projet_id: projectId,
    sous_traitant_id: "",
    reference: "",
    montant: "",
    date_debut: "",
    date_fin: "",
    statut: "brouillon",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      sous_traitant_id: parseInt(formData.sous_traitant_id),
      montant: formData.montant ? parseFloat(formData.montant) : null,
    });
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: C.card, borderRadius: C.radius, padding: 24,
        width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto"
      }}>
        <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: C.ink, margin: "0 0 20px" }}>
          Nouveau contrat
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" }}>
              Sous-traitant *
            </label>
            <select
              value={formData.sous_traitant_id}
              onChange={(e) => setFormData({ ...formData, sous_traitant_id: e.target.value })}
              required
              style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.paper, width: "100%" }}
            >
              <option value="">Sélectionner un sous-traitant</option>
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <Field
            label="Référence"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          />

          <Field
            label="Montant (€)"
            type="number"
            value={formData.montant}
            onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field
              label="Date de début"
              type="date"
              value={formData.date_debut}
              onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
            />

            <Field
              label="Date de fin"
              type="date"
              value={formData.date_fin}
              onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.paper, cursor: "pointer", color: C.ink }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", borderRadius: C.radius, border: "none", background: C.accent, cursor: "pointer", color: "#fff" }}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, required = false }) {
  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" }}>
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.paper, width: "100%" }}
      />
    </div>
  );
}
