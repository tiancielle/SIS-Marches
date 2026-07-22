// Home Dashboard — cockpit de décision, pas un alignement de cartes.
// Composé de petits composants dédiés (modules/accueil/components/*), chacun branché sur
// le state réel de l'app via useData(). Seules deux zones restent volontairement "simulées" :
// la recommandation stratégique de synthèse et la courbe de dynamique hebdomadaire — faute de
// séries temporelles côté backend pour l'instant (même logique que analyserMarche dans
// DataContext, qui simule déjà l'appel LLM en attendant l'endpoint réel).
import React from "react";
import Header from "../../../components/layout/Header";
import { useData } from "../../../store/DataContext";
import { C } from "../../../styles/theme";

import HeroSummary from "../components/HeroSummary";
import KpiRow from "../components/KpiRow";
import AiRecommendations from "../components/AiRecommendations";
import PerformanceChart from "../components/PerformanceChart";
import AlertsPanel from "../components/AlertsPanel";
import UpcomingEvents from "../components/UpcomingEvents";
import RecentActivity from "../components/RecentActivity";
import MyProjects from "../components/MyProjects";

const SECTION_GAP = 20;

export default function DashboardPage() {
  const { projects, marches, analyses, contrats, dceList, getHistoryForProject } = useData();

  const nouveauxCount = marches.filter((m) => m.statut === "nouveau").length;
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const urgentCount = marches.filter(
    (m) => m.date_limite_remise && new Date(m.date_limite_remise) >= now && new Date(m.date_limite_remise) <= in7Days
  ).length;

  return (
    <div>
      <Header title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />

      <div style={{ padding: "24px 32px 48px", display: "flex", flexDirection: "column", gap: SECTION_GAP, background: C.paper }}>
        <HeroSummary firstName="Hiba" newCount={nouveauxCount} urgentCount={urgentCount} lastSync="il y a 4 minutes" />

        <KpiRow marches={marches} analyses={analyses} contrats={contrats} dceList={dceList} />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: SECTION_GAP, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: SECTION_GAP, minWidth: 0 }}>
            <AiRecommendations marches={marches} analyses={analyses} />
            <PerformanceChart marches={marches} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: SECTION_GAP, minWidth: 0 }}>
            <AlertsPanel marches={marches} contrats={contrats} dceList={dceList} />
            <UpcomingEvents marches={marches} contrats={contrats} projects={projects} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: SECTION_GAP, alignItems: "start" }}>
          <RecentActivity
            projects={projects}
            getHistoryForProject={getHistoryForProject}
            analyses={analyses}
            marches={marches}
          />
          <MyProjects projects={projects} />
        </div>
      </div>
    </div>
  );
}
