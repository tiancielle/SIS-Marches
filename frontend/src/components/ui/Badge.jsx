// Badge de statut réutilisable (ex: Actif, Payé, En retard) — style pastille TenderWatch.
import React from "react";
import { C, FONT } from "../../styles/theme";

const MAP = {
  actif: { label: "Actif", color: C.success },
  termine: { label: "Terminé", color: C.mute },
  brouillon: { label: "Brouillon", color: C.faint },
};

export default function Badge({ status }) {
  const s = MAP[status] || MAP.brouillon;
  return (
    <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: s.color }}>
      ● {s.label}
    </span>
  );
}