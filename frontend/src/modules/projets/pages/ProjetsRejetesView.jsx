import React from "react";
import Header from "../../../components/layout/Header";
import ProjectList from "../components/ProjectList";
import { useData } from "../../../store/DataContext";

export default function ProjetsRejetesView() {
  const { projects } = useData();
  const rejetes = projects.filter(p => 
    (p.workflow_state === "archive" || p.workflow_state === undefined) && 
    (p.statut === "perdu" || p.statut === "abandonne")
  );
  
  return (
    <div>
      <Header
        title="Marchés perdus"
        subtitle={`${rejetes.length} marché${rejetes.length > 1 ? "s" : ""} perdu${rejetes.length > 1 ? "s" : ""} ou abandonné${rejetes.length > 1 ? "s" : ""}`}
      />
      <ProjectList statutFilter={["perdu", "abandonne"]} viewMode="table" />
    </div>
  );
}
