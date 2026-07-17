// Ligne de KPI — dérivés du state réel (useData), pas de valeurs figées.
// Choix des métriques : elles suivent le pipeline marché → analyse → conversion → contrat,
// c'est ce qui fait qu'elles racontent une histoire plutôt que d'aligner des totaux isolés.
import React from "react";
import { FileSearch, Sparkles, FileCheck2, Target, ClipboardList, CalendarClock } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";

export default function KpiRow({ marches, analyses, contrats, dceList }) {
  const nouveaux = marches.filter((m) => m.statut === "nouveau").length;
  const analysés = analyses.length;
  const contratsActifs = contrats.filter((c) => c.statut === "actif").length;

  const scoreMoyen = analyses.length
    ? Math.round(analyses.reduce((sum, a) => sum + a.score_pertinence, 0) / analyses.length)
    : null;

  const dossiersEnPreparation = dceList.length;

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const now = new Date();
  const echeances =
    marches.filter((m) => m.date_limite_remise && new Date(m.date_limite_remise) >= now && new Date(m.date_limite_remise) <= in7Days).length +
    contrats.filter((c) => c.date_fin && new Date(c.date_fin) >= now && new Date(c.date_fin) <= in7Days).length;

  const cards = [
    {
      label: "Marchés analysés", value: analysés, icon: FileSearch,
      subtext: marches.length ? `sur ${marches.length} au total` : "aucun marché importé",
    },
    {
      label: "Nouveaux aujourd'hui", value: nouveaux, icon: Sparkles,
      subtext: nouveaux > 0 ? "en attente d'analyse" : "rien de nouveau",
      tone: nouveaux > 0 ? "warning" : "neutral",
    },
    {
      label: "Contrats actifs", value: contratsActifs, icon: FileCheck2,
      subtext: contrats.length ? `sur ${contrats.length} contrats` : "aucun contrat",
    },
    {
      label: "Score IA moyen", value: scoreMoyen !== null ? `${scoreMoyen}%` : "—", icon: Target,
      subtext: scoreMoyen !== null ? "pertinence des marchés analysés" : "pas encore d'analyse",
      tone: scoreMoyen !== null && scoreMoyen >= 60 ? "success" : "neutral",
    },
    {
      label: "Dossiers en préparation", value: dossiersEnPreparation, icon: ClipboardList,
      subtext: "DCE en cours de montage",
    },
    {
      label: "Échéances 7 jours", value: echeances, icon: CalendarClock,
      subtext: echeances > 0 ? "remises et fins de contrat" : "aucune échéance proche",
      tone: echeances > 0 ? "danger" : "neutral",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
