import React, { useState } from "react";
import Header from "../../components/layout/Header";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { SEED_PROJETS, fmt } from "../../lib/mockData";

export default function ProjectsView() {
  const [query, setQuery] = useState("");

  const rows = SEED_PROJETS.filter((p) =>
    p.nom.toLowerCase().includes(query.toLowerCase())
  );

  const columns = [
    { key: "nom", label: "Projet" },
    { key: "client", label: "Client" },
    { key: "lieu", label: "Lieu" },
    { key: "budget", label: "Budget", render: (r) => fmt(r.budget) },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
    { key: "chef", label: "Chef de projet" },
  ];

  return (
    <div>
      <Header
        title="Projets"
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau projet"
        onAction={() => alert("Formulaire à venir")}
      />
      <div style={{ padding: "20px 32px" }}>
        <Table columns={columns} rows={rows} />
      </div>
    </div>
  );
}