import React from "react";
import { Briefcase, FileText, Send, Coins, AlertCircle } from "lucide-react";
import KPICard from "../../../components/ui/KPICard";
import { COLORS, TYPOGRAPHY, SPACING } from "../../../styles/designSystem";
import { formatMontant } from "../../../lib/mockData";

export default function OpportuniteKPIs({ opportunites }) {
  // Calculer les KPIs
  const actives = opportunites.filter(o => 
    ["interesse", "en_preparation", "pret_a_deposer", "soumis"].includes(o.statut)
  );
  
  const enPreparation = opportunites.filter(o => 
    ["en_preparation", "pret_a_deposer"].includes(o.statut)
  );
  
  const depots = opportunites.filter(o => o.statut === "soumis");
  
  const budgetPotentiel = actives.reduce((sum, o) => sum + (o.budget || o.montant_estimatif || 0), 0);
  
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const urgentes = actives.filter(o => {
    const dateLimite = o.date_limite_ao || o.fin;
    return dateLimite && new Date(dateLimite) >= now && new Date(dateLimite) <= in7Days;
  });

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    }}>
      <KPICard
        label="Actives"
        value={actives.length}
        icon={Briefcase}
        tone="info"
      />
      
      <KPICard
        label="En préparation"
        value={enPreparation.length}
        icon={FileText}
        tone="warning"
      />
      
      <KPICard
        label="Déposés"
        value={depots.length}
        icon={Send}
        tone="success"
      />
      
      <KPICard
        label="Potentiel"
        value={formatMontant(budgetPotentiel)}
        icon={Coins}
        tone="neutral"
      />
      
      <KPICard
        label="Urgentes"
        value={urgentes.length}
        icon={AlertCircle}
        tone={urgentes.length > 0 ? "danger" : "success"}
      />
    </div>
  );
}
