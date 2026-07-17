import React from "react";
import { Banknote } from "lucide-react";
import Header from "../../../components/layout/Header";
import ComingSoonState from "../../../components/ui/ComingSoonState";
import { C } from "../../../styles/theme";

export default function PaiementsPage() {
  return (
    <div>
      <Header title="Paiements" subtitle="Suivi de la trésorerie et des encaissements" />
      <div style={{ padding: "40px 32px", background: C.paper, minHeight: "calc(100vh - 140px)" }}>
        <ComingSoonState
          icon={Banknote}
          title="Module Paiements — bientôt disponible"
          description="Une fois les factures connectées, ce module suivra les encaissements et donnera une vue d'ensemble de la trésorerie par projet."
          features={[
            "Suivi des encaissements par facture",
            "Rapprochement avec les contrats correspondants",
            "Vue d'ensemble de la trésorerie par projet",
          ]}
          relatedLinks={[
            { label: "Voir les factures", to: "/factures" },
            { label: "Voir les contrats", to: "/contrats" },
          ]}
        />
      </div>
    </div>
  );
}