import React from "react";
import { MapPin, Wallet, CalendarRange, User, Building2, FileText } from "lucide-react";
import { fmt, fmtDate } from "../../../../lib/mockData";
import { C, FONT } from "../../../../styles/theme";

export default function InfoTab({ project }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
      <InfoSection title="Informations générales">
        <InfoRow icon={Building2} label="Client" value={project.client || "Non spécifié"} />
        <InfoRow icon={MapPin} label="Lieu" value={project.lieu || "Non spécifié"} />
        <InfoRow icon={User} label="Chef de projet" value={project.chef || "Non assigné"} />
      </InfoSection>

      <InfoSection title="Budget et planning">
        <InfoRow icon={Wallet} label="Budget" value={fmt(project.budget || 0)} />
        <InfoRow icon={CalendarRange} label="Début" value={fmtDate(project.debut)} />
        <InfoRow icon={CalendarRange} label="Fin" value={fmtDate(project.fin)} />
      </InfoSection>

      <InfoSection title="Description" full>
        <p style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
          {project.description || "Aucune description"}
        </p>
      </InfoSection>

      {project.url_avis && (
        <InfoSection title="Lien vers l'avis d'offres" full>
          <a
            href={project.url_avis}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: FONT, fontSize: 13.5, color: C.accent, textDecoration: "none" }}
          >
            {project.url_avis}
          </a>
        </InfoSection>
      )}
    </div>
  );
}

function InfoSection({ title, children, full = false }) {
  return (
    <div style={{ 
      background: C.card, 
      border: `1px solid ${C.line}`, 
      borderRadius: C.radius, 
      padding: 20,
      ...(full && { gridColumn: "1 / -1" })
    }}>
      <h3 style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.ink, margin: "0 0 16px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={16} color={C.mute} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint, marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
