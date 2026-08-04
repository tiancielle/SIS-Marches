import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/Modal";
import Field from "../../../components/ui/Field";
import { useData } from "../../../store/DataContext";
import { C, FONT } from "../../../styles/theme";

export default function EntiteForm({ onClose, onSave, initialData = {} }) {
  const { addProject } = useData();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    client: initialData.client || "",
    lieu: initialData.lieu || "",
    description: initialData.description || "",
    budget: initialData.budget || "",
    debut: initialData.debut || "",
    fin: initialData.fin || "",
    chef: initialData.chef || "",
    statut: initialData.statut || "interesse",
    workflow_state: initialData.workflow_state || "opportunite",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await addProject({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });
      if (onSave) onSave(created);
      onClose();
      // Naviguer vers la vue appropriée selon le workflow_state
      if (formData.workflow_state === "opportunite") {
        navigate(`/opportunites/${created.id}`);
      } else {
        navigate(`/projets/${created.id}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  return (
    <Modal onClose={onClose} title={initialData.id ? "Modifier" : "Nouvelle opportunité/projet"}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Nom du projet/opportunité"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
        />

        <Field
          label="Client"
          value={formData.client}
          onChange={(e) => setFormData({ ...formData, client: e.target.value })}
        />

        <Field
          label="Lieu"
          value={formData.lieu}
          onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
        />

        <Field
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <Field
          label="Budget estimé (€)"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field
            label="Date de début"
            type="date"
            value={formData.debut}
            onChange={(e) => setFormData({ ...formData, debut: e.target.value })}
          />

          <Field
            label="Date de fin"
            type="date"
            value={formData.fin}
            onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
          />
        </div>

        <Field
          label="Chef de projet"
          value={formData.chef}
          onChange={(e) => setFormData({ ...formData, chef: e.target.value })}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" }}>
              Type
            </label>
            <select
              value={formData.workflow_state}
              onChange={(e) => setFormData({ ...formData, workflow_state: e.target.value })}
              style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, width: "100%" }}
            >
              <option value="opportunite">Opportunité d'affaires</option>
              <option value="projet">Projet</option>
            </select>
          </div>

          <div>
            <label style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6, display: "block" }}>
              Statut initial
            </label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, width: "100%" }}
            >
              {formData.workflow_state === "opportunite" ? (
                <>
                  <option value="interesse">Intéressé</option>
                  <option value="en_preparation">En préparation</option>
                  <option value="soumis">Déposée</option>
                </>
              ) : (
                <>
                  <option value="en_execution">En exécution</option>
                  <option value="actif">Actif</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer", color: C.ink }}
          >
            Annuler
          </button>
          <button
            type="submit"
            style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", borderRadius: C.radius, border: "none", background: C.accent, cursor: "pointer", color: "#fff" }}
          >
            {initialData.id ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
