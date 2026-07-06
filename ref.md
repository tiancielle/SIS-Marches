import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, FileText, Receipt, Wallet, Layers,
  Search, Plus, TrendingUp, AlertCircle, CheckCircle2, Clock,
  X, ChevronRight, Building2, Calendar, Filter, ArrowUpRight,
  CircleDollarSign, FileWarning, Hourglass, BadgeCheck, Trash2, Pencil, FolderKanban, MapPin, HardHat,
  Paperclip, Upload, Eye, Download, FileImage, File as FileIcon, Trash
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ---------- Design tokens ----------
const C = {
  ink: "#0F1B2D",
  paper: "#F3F6FB",
  card: "#FFFFFF",
  line: "#E3E9F2",
  olive: "#1E5FC4",
  oliveLt: "#4F86DC",
  clay: "#D14343",
  ochre: "#E0A02E",
  teal: "#1E88A8",
  mute: "#6B7891",
};

const STATUS = {
  paye:      { label: "Payé",        color: "#1E7A46", bg: "#E3F3EA" },
  partiel:   { label: "Partiel",     color: "#B7791F", bg: "#FBF1DA" },
  attente:   { label: "En attente",  color: "#1E5FC4", bg: "#E4ECFA" },
  retard:    { label: "En retard",   color: "#D14343", bg: "#FBE4E4" },
  actif:     { label: "Actif",       color: "#1E5FC4", bg: "#E4ECFA" },
  termine:   { label: "Terminé",     color: "#6B7891", bg: "#EEF1F6" },
  brouillon: { label: "Brouillon",   color: "#6B7891", bg: "#EEF1F6" },
};

// ---------- Seed data ----------
const SEED_SUBS = [
  { id: 1, name: "Atlas BTP", contact: "M. Karim Benali", email: "k.benali@atlasbtp.ma", phone: "+212 661 11 22 33", specialite: "Gros œuvre", ice: "001789456000012" },
  { id: 2, name: "ElectroNord", contact: "Mme S. Idrissi", email: "contact@electronord.ma", phone: "+212 662 44 55 66", specialite: "Électricité", ice: "002345678000034" },
  { id: 3, name: "AquaFlux", contact: "M. Y. Tahiri", email: "ytahiri@aquaflux.ma", phone: "+212 663 77 88 99", specialite: "Plomberie / CVC", ice: "003456789000056" },
  { id: 4, name: "VitroLine", contact: "M. R. Ouazzani", email: "r.o@vitroline.ma", phone: "+212 664 12 34 56", specialite: "Menuiserie alu", ice: "004567890000078" },
];

const SEED_PROJETS = [
  { id: 1, nom: "Résidence Yasmine", client: "Groupe Amal Immobilier", lieu: "Rabat — Hay Riad", budget: 4200000, debut: "2025-02-01", fin: "2025-11-30", statut: "actif", chef: "I. Bennani" },
  { id: 2, nom: "Centre d'affaires Atlas", client: "Atlas Invest", lieu: "Casablanca — Sidi Maarouf", budget: 1500000, debut: "2025-03-15", fin: "2025-09-15", statut: "actif", chef: "N. Fassi" },
  { id: 3, nom: "Villa Souissi", client: "Particulier", lieu: "Rabat — Souissi", budget: 350000, debut: "2024-09-01", fin: "2025-01-30", statut: "termine", chef: "I. Bennani" },
];

const SEED_CONTRATS = [
  { id: 1, subId: 1, projetId: 1, ref: "CT-2025-014", montant: 1850000, debut: "2025-02-01", fin: "2025-11-30", statut: "actif" },
  { id: 2, subId: 2, projetId: 2, ref: "CT-2025-021", montant: 640000, debut: "2025-03-15", fin: "2025-09-15", statut: "actif" },
  { id: 3, subId: 3, projetId: 1, ref: "CT-2025-009", montant: 420000, debut: "2025-02-10", fin: "2025-08-20", statut: "actif" },
  { id: 4, subId: 4, projetId: 3, ref: "CT-2024-088", montant: 310000, debut: "2024-09-01", fin: "2025-01-30", statut: "termine" },
];

// phases per contract with their invoices
const SEED_FACTURES = [
  { id: 1, contratId: 1, phase: "Phase 1 — Fondations", ref: "F-0142", montant: 555000, date: "2025-03-05", statut: "paye" },
  { id: 2, contratId: 1, phase: "Phase 2 — Élévation", ref: "F-0167", montant: 600000, date: "2025-06-12", statut: "partiel" },
  { id: 3, contratId: 1, phase: "Phase 3 — Finitions", ref: "F-0190", montant: 695000, date: "2025-10-01", statut: "attente" },
  { id: 4, contratId: 2, phase: "Phase 1 — Réseaux", ref: "F-0151", montant: 320000, date: "2025-04-20", statut: "paye" },
  { id: 5, contratId: 2, phase: "Phase 2 — Tableaux & pose", ref: "F-0178", montant: 320000, date: "2025-07-18", statut: "retard" },
  { id: 6, contratId: 3, phase: "Phase 1 — Évacuation", ref: "F-0149", montant: 210000, date: "2025-03-28", statut: "paye" },
  { id: 7, contratId: 3, phase: "Phase 2 — CVC", ref: "F-0182", montant: 210000, date: "2025-07-30", statut: "partiel" },
  { id: 8, contratId: 4, phase: "Phase unique — Pose", ref: "F-0098", montant: 310000, date: "2024-12-15", statut: "paye" },
];

const SEED_PAIEMENTS = [
  { id: 1, factureId: 1, montant: 555000, date: "2025-03-20", mode: "Virement" },
  { id: 2, factureId: 2, montant: 300000, date: "2025-06-30", mode: "Virement" },
  { id: 3, factureId: 4, montant: 320000, date: "2025-05-05", mode: "Chèque" },
  { id: 4, factureId: 6, montant: 210000, date: "2025-04-10", mode: "Virement" },
  { id: 5, factureId: 7, montant: 105000, date: "2025-08-12", mode: "Virement" },
  { id: 6, factureId: 8, montant: 310000, date: "2024-12-28", mode: "Chèque" },
];

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " DH";
const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(0) + "k" : n);

// ---------- Small UI atoms ----------
function Badge({ s }) {
  const st = STATUS[s] || STATUS.brouillon;
  return (
    <span style={{
      background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 999,
      fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2, whiteSpace: "nowrap",
      fontFamily: "'IBM Plex Mono', monospace"
    }}>{st.label}</span>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 16,
      padding: "18px 20px", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", right: -18, top: -18, width: 80, height: 80,
        borderRadius: "50%", background: accent, opacity: 0.10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.mute, fontSize: 12.5, fontWeight: 600 }}>
        <Icon size={15} color={accent} /> {label}
      </div>
      <div style={{ fontSize: 27, fontWeight: 800, color: C.ink, marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: -0.3 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ---------- Modal ----------
function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(17,21,15,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: 20, width: "min(560px, 100%)", maxHeight: "88vh",
        overflow: "auto", border: `1px solid ${C.line}`, boxShadow: "0 30px 80px rgba(17,21,15,.3)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: `1px solid ${C.line}` }}>
          <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, color: C.ink }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.mute }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.mute, display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`,
  background: C.paper, fontSize: 14, color: C.ink, fontFamily: "inherit", boxSizing: "border-box"
};

// ---------- File attachment helpers ----------
// A file is stored as { name, type, size, data } where data is a base64 dataURL (kept in memory).
function FileInput({ value, onChange, accept = "image/*,application/pdf" }) {
  const readFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { alert("Fichier trop volumineux (max 4 Mo)."); return; }
    const reader = new FileReader();
    reader.onload = () => onChange({ name: f.name, type: f.type, size: f.size, data: reader.result });
    reader.readAsDataURL(f);
  };
  if (value) {
    const isImg = value.type?.startsWith("image/");
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.paper }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: isImg ? "transparent" : "#E4ECFA", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
          {isImg ? <img src={value.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 : <FileIcon size={18} color={C.olive} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value.name}</div>
          <div style={{ fontSize: 11.5, color: C.mute }}>{(value.size / 1024).toFixed(0)} Ko</div>
        </div>
        <button type="button" onClick={() => onChange(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.clay }}><Trash size={16} /></button>
      </div>
    );
  }
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", border: `1.5px dashed ${C.line}`, borderRadius: 10, background: C.paper, cursor: "pointer", color: C.mute, fontSize: 13.5, fontWeight: 600 }}>
      <Upload size={16} /> Choisir un fichier (PDF ou image)
      <input type="file" accept={accept} onChange={readFile} style={{ display: "none" }} />
    </label>
  );
}

// Small inline chip shown in tables; opens the viewer modal on click
function FileChip({ file, onView, label = "Voir" }) {
  if (!file) return <span style={{ fontSize: 12.5, color: C.mute }}>—</span>;
  const isImg = file.type?.startsWith("image/");
  return (
    <button onClick={onView} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#E4ECFA", color: C.olive, border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
      {isImg ? <FileImage size={14} /> : <Paperclip size={14} />} {label}
    </button>
  );
}

// Full-screen viewer for an attachment
function AttachmentModal({ file, title, onClose }) {
  const isImg = file.type?.startsWith("image/");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,27,45,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 18, width: "min(820px,100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
            <div style={{ fontSize: 12, color: C.mute }}>{file.name} · {(file.size / 1024).toFixed(0)} Ko</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={file.data} download={file.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.olive, color: "#fff", textDecoration: "none", borderRadius: 9, padding: "8px 14px", fontSize: 13, fontWeight: 700 }}><Download size={15} /> Télécharger</a>
            <button onClick={onClose} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 9, padding: 8, cursor: "pointer", color: C.mute }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          {isImg
            ? <img src={file.data} alt={file.name} style={{ maxWidth: "100%", maxHeight: "78vh", borderRadius: 8 }} />
            : <iframe title={file.name} src={file.data} style={{ width: "100%", height: "78vh", border: "none", borderRadius: 8, background: "#fff" }} />}
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [nav, setNav] = useState("dashboard");
  const [subs, setSubs] = useState(SEED_SUBS);
  const [projets, setProjets] = useState(SEED_PROJETS);
  const [contrats, setContrats] = useState(SEED_CONTRATS);
  const [factures, setFactures] = useState(SEED_FACTURES);
  const [paiements, setPaiements] = useState(SEED_PAIEMENTS);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // {type, data}
  const [viewFile, setViewFile] = useState(null); // {file, title}

  // derived: paid amount per facture
  const paidByFacture = useMemo(() => {
    const m = {};
    paiements.forEach(p => { m[p.factureId] = (m[p.factureId] || 0) + p.montant; });
    return m;
  }, [paiements]);

  const totals = useMemo(() => {
    const facture = factures.reduce((s, f) => s + f.montant, 0);
    const paye = paiements.reduce((s, p) => s + p.montant, 0);
    const enRetard = factures.filter(f => f.statut === "retard")
      .reduce((s, f) => s + (f.montant - (paidByFacture[f.id] || 0)), 0);
    const reste = facture - paye;
    return { facture, paye, reste, enRetard };
  }, [factures, paiements, paidByFacture]);

  const subName = (id) => subs.find(s => s.id === id)?.name || "—";
  const contratById = (id) => contrats.find(c => c.id === id);
  const projetById = (id) => projets.find(p => p.id === id);
  const projetName = (id) => projetById(id)?.nom || "—";

  // CRUD helpers
  const nextId = (arr) => (arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1);
  const removeSub = (id) => {
    if (!window.confirm("Supprimer ce sous-traitant et ses données liées ?")) return;
    const cIds = contrats.filter(c => c.subId === id).map(c => c.id);
    const fIds = factures.filter(f => cIds.includes(f.contratId)).map(f => f.id);
    setPaiements(p => p.filter(x => !fIds.includes(x.factureId)));
    setFactures(f => f.filter(x => !cIds.includes(x.contratId)));
    setContrats(c => c.filter(x => x.subId !== id));
    setSubs(s => s.filter(x => x.id !== id));
  };
  const removeProjet = (id) => {
    if (!window.confirm("Supprimer ce projet et ses contrats/factures/paiements liés ?")) return;
    const cIds = contrats.filter(c => c.projetId === id).map(c => c.id);
    const fIds = factures.filter(f => cIds.includes(f.contratId)).map(f => f.id);
    setPaiements(p => p.filter(x => !fIds.includes(x.factureId)));
    setFactures(f => f.filter(x => !cIds.includes(x.contratId)));
    setContrats(c => c.filter(x => x.projetId !== id));
    setProjets(p => p.filter(x => x.id !== id));
  };

  // ---- charts data ----
  const chartByStatus = useMemo(() => {
    const g = {};
    factures.forEach(f => {
      g[f.statut] = (g[f.statut] || 0) + f.montant;
    });
    return Object.entries(g).map(([k, v]) => ({ name: STATUS[k]?.label || k, value: v, key: k }));
  }, [factures]);

  const chartBySub = useMemo(() => {
    return subs.map(s => {
      const cIds = contrats.filter(c => c.subId === s.id).map(c => c.id);
      const fac = factures.filter(f => cIds.includes(f.contratId));
      const facture = fac.reduce((a, f) => a + f.montant, 0);
      const paye = fac.reduce((a, f) => a + (paidByFacture[f.id] || 0), 0);
      return { name: s.name, Facturé: facture, Payé: paye };
    });
  }, [subs, contrats, factures, paidByFacture]);

  const monthlyFlow = useMemo(() => {
    const m = {};
    paiements.forEach(p => {
      const k = p.date.slice(0, 7);
      m[k] = (m[k] || 0) + p.montant;
    });
    return Object.entries(m).sort().map(([k, v]) => ({ mois: k, montant: v }));
  }, [paiements]);

  const NAV = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "projets", label: "Projets", icon: FolderKanban },
    { id: "subs", label: "Sous-traitants", icon: Users },
    { id: "contrats", label: "Contrats", icon: FileText },
    { id: "factures", label: "Factures & phases", icon: Receipt },
    { id: "paiements", label: "Paiements", icon: Wallet },
  ];

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: C.paper, color: C.ink,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 11.5px; text-transform: uppercase; letter-spacing: .6px; color: ${C.mute}; font-weight: 700; padding: 12px 14px; border-bottom: 1px solid ${C.line}; }
        td { padding: 13px 14px; font-size: 14px; border-bottom: 1px solid ${C.line}; }
        tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: ${C.paper}; }
        .navbtn:hover { background: rgba(255,255,255,.08) !important; }
        button { font-family: inherit; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: 252, background: C.ink, color: "#EDEADD", padding: "26px 18px",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 6px 22px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.olive,
            display: "grid", placeItems: "center", color: "#fff", fontWeight: 900,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18 }}>S</div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17 }}>SIS Consultants</div>
            <div style={{ fontSize: 11, color: "#9C9A8A", letterSpacing: .4 }}>Gestion sous-traitance</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
          {NAV.map(n => {
            const active = nav === n.id;
            return (
              <button key={n.id} className="navbtn" onClick={() => setNav(n.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
                borderRadius: 11, border: "none", cursor: "pointer", textAlign: "left",
                background: active ? C.olive : "transparent",
                color: active ? "#fff" : "#C8C6B8", fontSize: 14, fontWeight: active ? 700 : 500,
                transition: "background .15s"
              }}>
                <n.icon size={18} /> {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", background: "rgba(255,255,255,.05)", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#9C9A8A" }}>Reste à payer</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 4 }}>
            {fmt(totals.reste)}
          </div>
          {totals.enRetard > 0 && (
            <div style={{ fontSize: 11.5, color: C.clay, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={13} /> {fmt(totals.enRetard)} en retard
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "26px 34px", overflow: "auto", maxWidth: "100%" }}>
        <Header
          nav={nav} query={query} setQuery={setQuery}
          onAdd={() => {
            if (nav === "projets") setModal({ type: "projet" });
            else if (nav === "subs") setModal({ type: "sub" });
            else if (nav === "contrats") setModal({ type: "contrat" });
            else if (nav === "factures") setModal({ type: "facture" });
            else if (nav === "paiements") setModal({ type: "paiement" });
            else setModal({ type: "projet" });
          }}
        />

        {nav === "dashboard" && (
          <Dashboard
            totals={totals} subs={subs} projets={projets} contrats={contrats} factures={factures}
            chartByStatus={chartByStatus} chartBySub={chartBySub} monthlyFlow={monthlyFlow}
            paidByFacture={paidByFacture} subName={subName} contratById={contratById}
            goto={setNav}
          />
        )}

        {nav === "projets" && (
          <ProjetsView projets={projets} contrats={contrats} factures={factures} paidByFacture={paidByFacture}
            subName={subName} query={query}
            onEdit={(d) => setModal({ type: "projet", data: d })} onDelete={removeProjet} goto={setNav} />
        )}

        {nav === "subs" && (
          <SubsView subs={subs} contrats={contrats} factures={factures} paidByFacture={paidByFacture}
            query={query} onEdit={(d) => setModal({ type: "sub", data: d })} onDelete={removeSub} />
        )}

        {nav === "contrats" && (
          <ContratsView contrats={contrats} subName={subName} projetName={projetName} factures={factures} paidByFacture={paidByFacture}
            query={query} onEdit={(d) => setModal({ type: "contrat", data: d })}
            onView={(file, title) => setViewFile({ file, title })}
            onDelete={(id) => setContrats(c => c.filter(x => x.id !== id))} />
        )}

        {nav === "factures" && (
          <FacturesView factures={factures} contratById={contratById} subName={subName} projetName={projetName}
            paidByFacture={paidByFacture} query={query}
            onEdit={(d) => setModal({ type: "facture", data: d })}
            onDelete={(id) => setFactures(f => f.filter(x => x.id !== id))} />
        )}

        {nav === "paiements" && (
          <PaiementsView paiements={paiements} factures={factures} contratById={contratById} subName={subName}
            query={query} onEdit={(d) => setModal({ type: "paiement", data: d })}
            onView={(file, title) => setViewFile({ file, title })}
            onDelete={(id) => setPaiements(p => p.filter(x => x.id !== id))} />
        )}
      </main>

      {/* Modals */}
      {modal?.type === "projet" && (
        <ProjetForm data={modal.data} onClose={() => setModal(null)} onSave={(v) => {
          setProjets(p => modal.data ? p.map(x => x.id === v.id ? v : x) : [...p, { ...v, id: nextId(p) }]);
          setModal(null);
        }} />
      )}
      {modal?.type === "sub" && (
        <SubForm data={modal.data} onClose={() => setModal(null)} onSave={(v) => {
          setSubs(s => modal.data ? s.map(x => x.id === v.id ? v : x) : [...s, { ...v, id: nextId(s) }]);
          setModal(null);
        }} />
      )}
      {modal?.type === "contrat" && (
        <ContratForm data={modal.data} subs={subs} projets={projets} onClose={() => setModal(null)} onSave={(v) => {
          setContrats(c => modal.data ? c.map(x => x.id === v.id ? v : x) : [...c, { ...v, id: nextId(c) }]);
          setModal(null);
        }} />
      )}
      {modal?.type === "facture" && (
        <FactureForm data={modal.data} contrats={contrats} subName={subName} projetName={projetName} onClose={() => setModal(null)} onSave={(v) => {
          setFactures(f => modal.data ? f.map(x => x.id === v.id ? v : x) : [...f, { ...v, id: nextId(f) }]);
          setModal(null);
        }} />
      )}
      {modal?.type === "paiement" && (
        <PaiementForm data={modal.data} factures={factures} contratById={contratById} subName={subName}
          paidByFacture={paidByFacture} onClose={() => setModal(null)} onSave={(v) => {
            setPaiements(p => modal.data ? p.map(x => x.id === v.id ? v : x) : [...p, { ...v, id: nextId(p) }]);
            setModal(null);
          }} />
      )}

      {viewFile && (
        <AttachmentModal file={viewFile.file} title={viewFile.title} onClose={() => setViewFile(null)} />
      )}
    </div>
  );
}

// ---------- Header ----------
function Header({ nav, query, setQuery, onAdd }) {
  const titles = {
    dashboard: "Tableau de bord", projets: "Projets", subs: "Sous-traitants", contrats: "Contrats",
    factures: "Factures & phases", paiements: "Paiements"
  };
  const showSearch = nav !== "dashboard";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 12.5, color: C.mute, fontWeight: 600, letterSpacing: .4 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <h1 style={{ margin: "2px 0 0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 800, letterSpacing: -0.4 }}>
          {titles[nav]}
        </h1>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {showSearch && (
          <div style={{ position: "relative" }}>
            <Search size={16} color={C.mute} style={{ position: "absolute", left: 12, top: 11 }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…"
              style={{ ...inputStyle, paddingLeft: 36, width: 230, background: C.card }} />
          </div>
        )}
        <button onClick={onAdd} style={{
          display: "flex", alignItems: "center", gap: 7, background: C.olive, color: "#fff",
          border: "none", padding: "11px 18px", borderRadius: 11, cursor: "pointer", fontWeight: 700, fontSize: 14
        }}>
          <Plus size={17} /> Nouveau
        </button>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ totals, subs, projets, contrats, factures, chartByStatus, chartBySub, monthlyFlow, paidByFacture, subName, contratById, goto }) {
  const pieColors = { paye: "#1E7A46", partiel: "#E0A02E", attente: "#1E5FC4", retard: "#D14343", brouillon: "#6B7891" };
  const alerts = factures.filter(f => f.statut === "retard" || f.statut === "partiel");
  const projetsActifs = projets.filter(p => p.statut === "actif");
  const subsByProjet = (pid) => {
    const cs = contrats.filter(c => c.projetId === pid);
    return new Set(cs.map(c => c.subId)).size;
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 22 }}>
        <Stat icon={FolderKanban} label="Projets en cours" value={projetsActifs.length} sub={`${projets.length} au total`} accent={C.olive} />
        <Stat icon={CircleDollarSign} label="Total facturé" value={fmt(totals.facture)} sub={`${factures.length} factures`} accent={C.teal} />
        <Stat icon={BadgeCheck} label="Total payé" value={fmt(totals.paye)} sub={`${Math.round(totals.paye / totals.facture * 100)}% réglé`} accent={C.olive} />
        <Stat icon={Hourglass} label="Reste à payer" value={fmt(totals.reste)} sub="solde global" accent={C.ochre} />
        <Stat icon={FileWarning} label="En retard" value={fmt(totals.enRetard)} sub={`${factures.filter(f => f.statut === "retard").length} factures`} accent={C.clay} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="Facturé vs Payé par sous-traitant">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartBySub} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.mute }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: C.mute }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Facturé" fill={C.teal} radius={[5, 5, 0, 0]} />
              <Bar dataKey="Payé" fill={C.olive} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Répartition par statut">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={chartByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {chartByStatus.map((e, i) => <Cell key={i} fill={pieColors[e.key] || C.mute} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card title="Flux de paiements mensuels">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyFlow}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.olive} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.olive} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: C.mute }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: C.mute }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 13 }} />
              <Area type="monotone" dataKey="montant" stroke={C.olive} strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Alertes paiements" action={() => goto("factures")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.length === 0 && <div style={{ color: C.mute, fontSize: 13 }}>Aucune alerte 🎉</div>}
            {alerts.map(f => {
              const ct = contratById(f.contratId);
              const reste = f.montant - (paidByFacture[f.id] || 0);
              return (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 11, background: C.paper, border: `1px solid ${C.line}` }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{subName(ct?.subId)}</div>
                    <div style={{ fontSize: 12, color: C.mute }}>{f.phase} · {f.ref}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge s={f.statut} />
                    <div style={{ fontSize: 12.5, color: C.clay, fontWeight: 700, marginTop: 4 }}>{fmt(reste)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Projets en cours" action={() => goto("projets")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {projetsActifs.length === 0 && <div style={{ color: C.mute, fontSize: 13 }}>Aucun projet actif</div>}
            {projetsActifs.map(p => {
              const cs = contrats.filter(c => c.projetId === p.id);
              const fac = factures.filter(f => cs.some(c => c.id === f.contratId));
              const facture = fac.reduce((a, f) => a + f.montant, 0);
              const paye = fac.reduce((a, f) => a + (paidByFacture[f.id] || 0), 0);
              const pct = facture ? Math.min(100, Math.round(paye / facture * 100)) : 0;
              return (
                <div key={p.id} style={{ padding: "13px 15px", borderRadius: 12, background: C.paper, border: `1px solid ${C.line}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.nom}</span>
                    <span style={{ fontSize: 12, color: C.mute, display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={13} /> {subsByProjet(p.id)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.mute, margin: "3px 0 9px" }}>{p.client}</div>
                  <div style={{ height: 7, background: C.line, borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.olive, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
                    <span style={{ color: C.mute }}>{pct}% payé</span>
                    <span style={{ fontWeight: 600 }}>{fmt(facture)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children, action }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16.5, fontWeight: 700 }}>{title}</h3>
        {action && <button onClick={action} style={{ background: "none", border: "none", color: C.olive, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 13, fontWeight: 600 }}>Voir tout <ChevronRight size={15} /></button>}
      </div>
      {children}
    </div>
  );
}

function TableCard({ children }) {
  return <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>{children}</div>;
}

function Actions({ onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button onClick={onEdit} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: 6, cursor: "pointer", color: C.teal }}><Pencil size={14} /></button>
      <button onClick={onDelete} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: 6, cursor: "pointer", color: C.clay }}><Trash2 size={14} /></button>
    </div>
  );
}

// ---------- Subs view ----------
function SubsView({ subs, contrats, factures, paidByFacture, query, onEdit, onDelete }) {
  const rows = subs.filter(s => (s.name + s.specialite + s.contact).toLowerCase().includes(query.toLowerCase()));
  return (
    <TableCard>
      <table>
        <thead><tr>
          <th>Sous-traitant</th><th>Spécialité</th><th>Contact</th><th>Contrats</th><th>Encours</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(s => {
            const cIds = contrats.filter(c => c.subId === s.id).map(c => c.id);
            const fac = factures.filter(f => cIds.includes(f.contratId));
            const reste = fac.reduce((a, f) => a + (f.montant - (paidByFacture[f.id] || 0)), 0);
            return (
              <tr key={s.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: C.olive, color: "#fff",
                      display: "grid", placeItems: "center", fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{s.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: C.mute, fontFamily: "'IBM Plex Mono',monospace" }}>ICE {s.ice}</div>
                    </div>
                  </div>
                </td>
                <td>{s.specialite}</td>
                <td><div>{s.contact}</div><div style={{ fontSize: 12, color: C.mute }}>{s.phone}</div></td>
                <td>{cIds.length}</td>
                <td style={{ fontWeight: 700, color: reste > 0 ? C.clay : C.olive }}>{fmt(reste)}</td>
                <td><Actions onEdit={() => onEdit(s)} onDelete={() => onDelete(s.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// ---------- Projets view ----------
function ProjetsView({ projets, contrats, factures, paidByFacture, subName, query, onEdit, onDelete, goto }) {
  const rows = projets.filter(p => (p.nom + p.client + p.lieu).toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
      {rows.map(p => {
        const cs = contrats.filter(c => c.projetId === p.id);
        const fac = factures.filter(f => cs.some(c => c.id === f.contratId));
        const facture = fac.reduce((a, f) => a + f.montant, 0);
        const paye = fac.reduce((a, f) => a + (paidByFacture[f.id] || 0), 0);
        const reste = facture - paye;
        const pct = facture ? Math.min(100, Math.round(paye / facture * 100)) : 0;
        // sous-traitants distincts sur ce projet, avec leur engagement
        const subMap = {};
        cs.forEach(c => {
          if (!subMap[c.subId]) subMap[c.subId] = { name: subName(c.subId), montant: 0 };
          subMap[c.subId].montant += c.montant;
        });
        const subList = Object.values(subMap);
        return (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800 }}>{p.nom}</h3>
                  <Badge s={p.statut} />
                </div>
                <div style={{ fontSize: 13, color: C.mute, marginTop: 4 }}>{p.client}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: C.mute, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {p.lieu}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><HardHat size={13} /> {p.chef}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} /> {p.debut} → {p.fin}</span>
                </div>
              </div>
              <Actions onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} />
            </div>

            {/* finances */}
            <div style={{ background: C.paper, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.mute }}>Engagé sous-traitants</span>
                <b>{fmt(facture)}</b>
              </div>
              <div style={{ height: 8, background: C.line, borderRadius: 99, margin: "8px 0 6px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: C.olive, borderRadius: 99 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#1E7A46" }}>Payé {fmt(paye)} · {pct}%</span>
                <span style={{ color: reste > 0 ? C.clay : C.mute }}>Reste {fmt(reste)}</span>
              </div>
            </div>

            {/* sous-traitants qui travaillent dessus */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.mute, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
                Sous-traitants ({subList.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {subList.length === 0 && <div style={{ fontSize: 13, color: C.mute }}>Aucun sous-traitant affecté</div>}
                {subList.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 9, border: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: C.olive, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>{s.name[0]}</div>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(s.montant)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Contrats view ----------
function ContratsView({ contrats, subName, projetName, factures, paidByFacture, query, onEdit, onDelete, onView }) {
  const rows = contrats.filter(c => (c.ref + projetName(c.projetId) + subName(c.subId)).toLowerCase().includes(query.toLowerCase()));
  return (
    <TableCard>
      <table>
        <thead><tr>
          <th>Référence</th><th>Sous-traitant</th><th>Projet</th><th>Montant</th><th>Avancement</th><th>Période</th><th>Contrat</th><th>Statut</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(c => {
            const fac = factures.filter(f => f.contratId === c.id);
            const paye = fac.reduce((a, f) => a + (paidByFacture[f.id] || 0), 0);
            const pct = c.montant ? Math.min(100, Math.round(paye / c.montant * 100)) : 0;
            return (
              <tr key={c.id}>
                <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{c.ref}</td>
                <td style={{ fontWeight: 600 }}>{subName(c.subId)}</td>
                <td>{projetName(c.projetId)}</td>
                <td style={{ fontWeight: 700 }}>{fmt(c.montant)}</td>
                <td style={{ minWidth: 130 }}>
                  <div style={{ height: 7, background: C.line, borderRadius: 99 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: C.olive, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: C.mute, marginTop: 3 }}>{pct}% payé</div>
                </td>
                <td style={{ fontSize: 12.5, color: C.mute }}>{c.debut} → {c.fin}</td>
                <td><FileChip file={c.fichier} onView={() => onView(c.fichier, `Contrat ${c.ref}`)} /></td>
                <td><Badge s={c.statut} /></td>
                <td><Actions onEdit={() => onEdit(c)} onDelete={() => onDelete(c.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// ---------- Factures view (grouped by contract/phase) ----------
function FacturesView({ factures, contratById, subName, projetName, paidByFacture, query, onEdit, onDelete }) {
  const rows = factures.filter(f => {
    const ct = contratById(f.contratId);
    return (f.ref + f.phase + projetName(ct?.projetId) + subName(ct?.subId)).toLowerCase().includes(query.toLowerCase());
  });
  return (
    <TableCard>
      <table>
        <thead><tr>
          <th>Facture</th><th>Sous-traitant</th><th>Phase</th><th>Date</th><th>Montant</th><th>Payé</th><th>Reste</th><th>Statut</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(f => {
            const ct = contratById(f.contratId);
            const paye = paidByFacture[f.id] || 0;
            const reste = f.montant - paye;
            return (
              <tr key={f.id}>
                <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{f.ref}</td>
                <td style={{ fontWeight: 600 }}>{subName(ct?.subId)}</td>
                <td><div>{f.phase}</div><div style={{ fontSize: 12, color: C.mute }}>{projetName(ct?.projetId)}</div></td>
                <td style={{ fontSize: 13, color: C.mute }}>{f.date}</td>
                <td style={{ fontWeight: 700 }}>{fmt(f.montant)}</td>
                <td style={{ color: C.olive, fontWeight: 600 }}>{fmt(paye)}</td>
                <td style={{ color: reste > 0 ? C.clay : C.mute, fontWeight: 600 }}>{fmt(reste)}</td>
                <td><Badge s={f.statut} /></td>
                <td><Actions onEdit={() => onEdit(f)} onDelete={() => onDelete(f.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// ---------- Paiements view ----------
function PaiementsView({ paiements, factures, contratById, subName, query, onEdit, onDelete, onView }) {
  const facById = (id) => factures.find(f => f.id === id);
  const rows = paiements.filter(p => {
    const f = facById(p.factureId);
    const ct = f && contratById(f.contratId);
    return ((f?.ref || "") + (p.mode) + subName(ct?.subId)).toLowerCase().includes(query.toLowerCase());
  });
  return (
    <TableCard>
      <table>
        <thead><tr>
          <th>Date</th><th>Sous-traitant</th><th>Facture / phase</th><th>Mode</th><th>Montant</th><th>Reçu</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(p => {
            const f = facById(p.factureId);
            const ct = f && contratById(f.contratId);
            return (
              <tr key={p.id}>
                <td style={{ fontSize: 13, color: C.mute }}>{p.date}</td>
                <td style={{ fontWeight: 600 }}>{subName(ct?.subId)}</td>
                <td><div style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{f?.ref}</div><div style={{ fontSize: 12, color: C.mute }}>{f?.phase}</div></td>
                <td>{p.mode}</td>
                <td style={{ fontWeight: 700, color: C.olive }}>{fmt(p.montant)}</td>
                <td><FileChip file={p.recu} onView={() => onView(p.recu, `Reçu — ${subName(ct?.subId)} (${p.date})`)} /></td>
                <td><Actions onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// ---------- Forms ----------
function ProjetForm({ data, onClose, onSave }) {
  const [v, setV] = useState(data || { nom: "", client: "", lieu: "", chef: "", budget: 0, debut: "", fin: "", statut: "actif" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={data ? "Modifier le projet" : "Nouveau projet"} onClose={onClose}>
      <Field label="Nom du projet"><input style={inputStyle} value={v.nom} onChange={set("nom")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Client / Maître d'ouvrage"><input style={inputStyle} value={v.client} onChange={set("client")} /></Field>
        <Field label="Chef de projet"><input style={inputStyle} value={v.chef} onChange={set("chef")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Lieu"><input style={inputStyle} value={v.lieu} onChange={set("lieu")} /></Field>
        <Field label="Budget (DH)"><input type="number" style={inputStyle} value={v.budget} onChange={(e) => setV({ ...v, budget: +e.target.value })} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Début"><input type="date" style={inputStyle} value={v.debut} onChange={set("debut")} /></Field>
        <Field label="Fin"><input type="date" style={inputStyle} value={v.fin} onChange={set("fin")} /></Field>
      </div>
      <Field label="Statut">
        <select style={inputStyle} value={v.statut} onChange={set("statut")}>
          <option value="actif">Actif</option><option value="termine">Terminé</option><option value="brouillon">Brouillon</option>
        </select>
      </Field>
      <SaveBtn onClick={() => v.nom && onSave(v)} />
    </Modal>
  );
}

function SubForm({ data, onClose, onSave }) {
  const [v, setV] = useState(data || { name: "", specialite: "", contact: "", email: "", phone: "", ice: "" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={data ? "Modifier le sous-traitant" : "Nouveau sous-traitant"} onClose={onClose}>
      <Field label="Raison sociale"><input style={inputStyle} value={v.name} onChange={set("name")} /></Field>
      <Field label="Spécialité"><input style={inputStyle} value={v.specialite} onChange={set("specialite")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Contact"><input style={inputStyle} value={v.contact} onChange={set("contact")} /></Field>
        <Field label="Téléphone"><input style={inputStyle} value={v.phone} onChange={set("phone")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Email"><input style={inputStyle} value={v.email} onChange={set("email")} /></Field>
        <Field label="ICE"><input style={inputStyle} value={v.ice} onChange={set("ice")} /></Field>
      </div>
      <SaveBtn onClick={() => v.name && onSave(v)} />
    </Modal>
  );
}

function ContratForm({ data, subs, projets, onClose, onSave }) {
  const [v, setV] = useState(data || { subId: subs[0]?.id, projetId: projets[0]?.id, ref: "", montant: 0, debut: "", fin: "", statut: "actif" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={data ? "Modifier le contrat" : "Nouveau contrat"} onClose={onClose}>
      <Field label="Projet">
        <select style={inputStyle} value={v.projetId} onChange={(e) => setV({ ...v, projetId: +e.target.value })}>
          {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </Field>
      <Field label="Sous-traitant">
        <select style={inputStyle} value={v.subId} onChange={(e) => setV({ ...v, subId: +e.target.value })}>
          {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Référence"><input style={inputStyle} value={v.ref} onChange={set("ref")} /></Field>
        <Field label="Montant (DH)"><input type="number" style={inputStyle} value={v.montant} onChange={(e) => setV({ ...v, montant: +e.target.value })} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Début"><input type="date" style={inputStyle} value={v.debut} onChange={set("debut")} /></Field>
        <Field label="Fin"><input type="date" style={inputStyle} value={v.fin} onChange={set("fin")} /></Field>
      </div>
      <Field label="Statut">
        <select style={inputStyle} value={v.statut} onChange={set("statut")}>
          <option value="actif">Actif</option><option value="termine">Terminé</option><option value="brouillon">Brouillon</option>
        </select>
      </Field>
      <Field label="Document du contrat (PDF ou image)">
        <FileInput value={v.fichier} onChange={(file) => setV({ ...v, fichier: file })} />
      </Field>
      <SaveBtn onClick={() => v.ref && onSave(v)} />
    </Modal>
  );
}

function FactureForm({ data, contrats, subName, projetName, onClose, onSave }) {
  const [v, setV] = useState(data || { contratId: contrats[0]?.id, phase: "", ref: "", montant: 0, date: "", statut: "attente" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <Modal title={data ? "Modifier la facture" : "Nouvelle facture / phase"} onClose={onClose}>
      <Field label="Contrat">
        <select style={inputStyle} value={v.contratId} onChange={(e) => setV({ ...v, contratId: +e.target.value })}>
          {contrats.map(c => <option key={c.id} value={c.id}>{c.ref} — {subName(c.subId)} ({projetName(c.projetId)})</option>)}
        </select>
      </Field>
      <Field label="Phase / désignation"><input style={inputStyle} value={v.phase} onChange={set("phase")} placeholder="ex: Phase 2 — Élévation" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="N° facture"><input style={inputStyle} value={v.ref} onChange={set("ref")} /></Field>
        <Field label="Montant (DH)"><input type="number" style={inputStyle} value={v.montant} onChange={(e) => setV({ ...v, montant: +e.target.value })} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Date"><input type="date" style={inputStyle} value={v.date} onChange={set("date")} /></Field>
        <Field label="Statut">
          <select style={inputStyle} value={v.statut} onChange={set("statut")}>
            <option value="attente">En attente</option><option value="partiel">Partiel</option>
            <option value="paye">Payé</option><option value="retard">En retard</option>
          </select>
        </Field>
      </div>
      <SaveBtn onClick={() => v.ref && onSave(v)} />
    </Modal>
  );
}

function PaiementForm({ data, factures, contratById, subName, paidByFacture, onClose, onSave }) {
  const [v, setV] = useState(data || { factureId: factures[0]?.id, montant: 0, date: "", mode: "Virement" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const sel = factures.find(f => f.id === +v.factureId);
  const reste = sel ? sel.montant - (paidByFacture[sel.id] || 0) + (data ? data.montant : 0) : 0;
  return (
    <Modal title={data ? "Modifier le paiement" : "Enregistrer un paiement"} onClose={onClose}>
      <Field label="Facture">
        <select style={inputStyle} value={v.factureId} onChange={(e) => setV({ ...v, factureId: +e.target.value })}>
          {factures.map(f => {
            const ct = contratById(f.contratId);
            return <option key={f.id} value={f.id}>{f.ref} — {subName(ct?.subId)} · {f.phase}</option>;
          })}
        </select>
      </Field>
      {sel && <div style={{ fontSize: 12.5, color: C.mute, marginTop: -6, marginBottom: 12 }}>Reste à régler : <b style={{ color: C.clay }}>{fmt(reste)}</b></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Montant (DH)"><input type="number" style={inputStyle} value={v.montant} onChange={(e) => setV({ ...v, montant: +e.target.value })} /></Field>
        <Field label="Date"><input type="date" style={inputStyle} value={v.date} onChange={set("date")} /></Field>
      </div>
      <Field label="Mode de paiement">
        <select style={inputStyle} value={v.mode} onChange={set("mode")}>
          <option>Virement</option><option>Chèque</option><option>Espèces</option><option>Effet</option>
        </select>
      </Field>
      <Field label="Reçu de paiement (PDF ou image)">
        <FileInput value={v.recu} onChange={(file) => setV({ ...v, recu: file })} />
      </Field>
      <SaveBtn onClick={() => v.montant > 0 && onSave(v)} />
    </Modal>
  );
}

function SaveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: C.olive, color: "#fff", border: "none", padding: "13px",
      borderRadius: 11, cursor: "pointer", fontWeight: 700, fontSize: 15, marginTop: 6
    }}>Enregistrer</button>
  );
}
