import React from "react";
import { Link } from "react-router-dom";
import { Users2, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import Header from "../../../components/layout/Header";
import StatCard from "../../../components/ui/StatCard";
import ComingSoonState from "../../../components/ui/ComingSoonState";
import { useData } from "../../../store/DataContext";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

function NavCard({ icon: Icon, title, description, to }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex", alignItems: "center", gap: 16, textDecoration: "none",
        background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius,
        padding: "18px 20px", flex: 1, minWidth: 240,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: C.accentLt, color: C.accent,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.ink }}>{title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: C.faint, marginTop: 2 }}>{description}</div>
      </div>
      <ArrowRight size={15} color={C.faint} style={{ flexShrink: 0 }} />
    </Link>
  );
}

export default function AdministrationPage() {
  const { users } = useData();
  const admins = users.filter((u) => u.role === "admin").length;
  const actifs = users.filter((u) => u.statut === "actif").length;

  return (
    <div>
      <Header title="Administration" subtitle="Paramètres de l'organisation, utilisateurs et sécurité" />
      <div style={{ padding: "20px 32px 40px", background: C.paper, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
          <StatCard label="Utilisateurs" value={users.length} icon={Users2} subtext={`${actifs} actifs`} />
          <StatCard label="Administrateurs" value={admins} icon={ShieldCheck} subtext="accès complet" />
        </div>

        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, marginBottom: 12 }}>
            Sections
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <NavCard
              icon={Users2} title="Utilisateurs & rôles"
              description="Gérer les comptes et les niveaux d'accès à la plateforme"
              to="/administration/utilisateurs"
            />
            <NavCard
              icon={ShieldCheck} title="Sécurité & accès"
              description="Politique de mot de passe, sessions, journal de connexions"
              to="/administration/securite"
            />
          </div>
        </div>

        <ComingSoonState
          icon={Building2}
          title="Paramètres de l'organisation — bientôt disponible"
          description="Coordonnées de l'entreprise, branding et préférences générales de la plateforme."
          features={[
            "Coordonnées et informations légales de l'organisation",
            "Logo et identité visuelle appliqués aux exports (factures, PDF)",
            "Préférences générales (fuseau horaire, format de date...)",
          ]}
        />
      </div>
    </div>
  );
}