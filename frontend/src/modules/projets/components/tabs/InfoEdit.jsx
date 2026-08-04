import React, { useState, useEffect } from "react";
import Field from "../../../../components/ui/Field";
import { C, FONT } from "../../../../styles/theme";

export default function InfoEdit({ project, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nom: project.nom || "",
    client: project.client || "",
    lieu: project.lieu || "",
    description: project.description || "",
    budget: project.budget || "",
    debut: project.debut || "",
    fin: project.fin || "",
    chef: project.chef || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field
            label="Nom du projet/opportunité"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>

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
          label="Chef de projet"
          value={formData.chef}
          onChange={(e) => setFormData({ ...formData, chef: e.target.value })}
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

        <div style={{ gridColumn: "1 / -1" }}>
          <Field
            label="Description"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ 
            fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", 
            borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, 
            cursor: "pointer", color: C.ink 
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          style={{ 
            fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "10px 20px", 
            borderRadius: C.radius, border: "none", background: C.accent, 
            cursor: "pointer", color: "#fff" 
          }}
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
