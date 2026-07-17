import React from "react";
import { Receipt } from "lucide-react";
import Header from "../../../components/layout/Header";
import ComingSoonState from "../../../components/ui/ComingSoonState";
import { C } from "../../../styles/theme";

export default function FacturesPage() {
  return (
    <div>
      <Header title="Factures" subtitle="Suivi de la facturation liée aux projets et contrats" />
      <div style={{ padding: "40px 32px", background: C.paper, minHeight: "calc(100vh - 140px)" }}>
        <ComingSoonState
          icon={Receipt}
          title="Module Factures — bientôt disponible"
          description="La facturation sera connectée directement aux projets et contrats existants, pour générer et suivre vos factures sans ressaisie."
          features={[
            "Génération de factures liées à un projet ou un contrat",
            "Suivi des statuts : émise, envoyée, payée, en retard",
            "Export PDF et comptable",
          ]}
          relatedLinks={[
            { label: "Voir les contrats", to: "/contrats" },
            { label: "Voir les projets", to: "/projects" },
          ]}
        />
      </div>
    </div>
  );
}