import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck2, Wallet, CalendarClock, Users2 } from "lucide-react";
import Header from "../../../components/layout/Header";
import Table from "../../../components/ui/Table";
import Badge from "../../../components/ui/Badge";
import Highlight from "../../../components/ui/Highlight";
import StatCard from "../../../components/ui/StatCard";
import ContratForm from "./ContratForm";
import { useData } from "../../../store/DataContext";
import { fmt, fmtDate } from "../../../lib/mockData";
import { C, FONT } from "../../../styles/theme";

export default function ContratsView() {
  const navigate = useNavigate();
  const { contrats, projects, subs, addContrat, setContratFile } = useData();
  const [query, setQuery] = useState("");
  const [projetFilter, setProjetFilter] = useState("");
  const [sort, setSort] = useState({ key: "reference", dir: "asc" });
  const [showForm, setShowForm] = useState(false);

  const nomProjet = (id) => projects.find((p) => p.id === id)?.nom || "—";
  const nomSub = (id) => subs.find((s) => s.id === id)?.name || "—";

  // KPI dérivés du même state que la liste — cohérent avec l'esprit "cockpit" des autres modules.
  const actifs = useMemo(() => contrats.filter((c) => c.statut === "actif"), [contrats]);
  const montantEngage = actifs.reduce((sum, c) => sum + (c.montant || 0), 0);
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const echeancesProches = actifs.filter((c) => c.date_fin && new Date(c.date_fin) >= now && new Date(c.date_fin) <= in30Days).length;
  const subsMobilises = new Set(actifs.map((c) => c.sous_traitant_id)).size;

  const rows = useMemo(() => {
    let list = contrats;
    if (projetFilter) list = list.filter((c) => c.projet_id === Number(projetFilter));
    if (query) list = list.filter((c) => c.reference.toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => {
      const cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contrats, query, projetFilter, sort]);

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };
  const sortableHeader = (key, label) => (
    <span style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(key)}>
      {label} {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
    </span>
  );

  const columns = [
    { key: "reference", label: sortableHeader("reference", "Référence"), render: (r) => <Highlight text={r.reference} query={query} /> },
    { key: "projet", label: "Projet", render: (r) => nomProjet(r.projet_id) },
    { key: "sous_traitant", label: "Sous-traitant", render: (r) => nomSub(r.sous_traitant_id) },
    { key: "montant", label: "Montant", render: (r) => fmt(r.montant) },
    { key: "date_fin", label: "Échéance", render: (r) => fmtDate(r.date_fin) },
    { key: "statut", label: "Statut", render: (r) => <Badge status={r.statut} /> },
  ];

  const emptyMessage = query
    ? `Aucun contrat ne correspond à « ${query} »`
    : projetFilter
    ? "Aucun contrat pour ce projet"
    : "Aucun contrat pour le moment";

  return (
    <div>
      <Header
        title="Contrats"
        subtitle={`${actifs.length} actif${actifs.length > 1 ? "s" : ""} sur ${contrats.length} au total`}
        searchValue={query}
        onSearchChange={setQuery}
        actionLabel="Nouveau contrat"
        onAction={() => setShowForm(true)}
      />

      <div style={{ padding: "20px 32px", background: C.paper }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
          <StatCard label="Contrats actifs" value={actifs.length} icon={FileCheck2} subtext={`${contrats.length} au total`} />
          <StatCard label="Montant engagé" value={fmt(montantEngage)} icon={Wallet} subtext="sur les contrats actifs" />
          <StatCard
            label="Échéances 30 jours" value={echeancesProches} icon={CalendarClock}
            subtext={echeancesProches > 0 ? "contrats à renouveler ou clore" : "aucune échéance proche"}
            tone={echeancesProches > 0 ? "warning" : "neutral"}
          />
          <StatCard label="Sous-traitants mobilisés" value={subsMobilises} icon={Users2} subtext="sur les contrats actifs" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <select
            value={projetFilter}
            onChange={(e) => setProjetFilter(e.target.value)}
            style={{ fontFamily: FONT, fontSize: 13, color: C.ink, padding: "8px 12px", borderRadius: C.radius, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer" }}
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>

        {rows.length > 0 ? (
          <Table columns={columns} rows={rows} onRowClick={(row) => navigate(`/contrats/${row.id}`)} />
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: 40, textAlign: "center", fontFamily: FONT, fontSize: 13.5, color: C.faint }}>
            {emptyMessage}
          </div>
        )}
      </div>

      {showForm && (
        <ContratForm
          onClose={() => setShowForm(false)}
          onSave={(data) => addContrat(data)}
          onFileSelected={(id, file) => setContratFile(id, file)}
        />
      )}
    </div>
  );
}