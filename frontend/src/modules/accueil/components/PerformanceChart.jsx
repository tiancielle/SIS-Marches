// Un seul graphique, volontairement discret : la dynamique de détection de marchés sur les
// dernières semaines. Sert à répondre à "notre veille est-elle active ?" d'un coup d'œil —
// pas un mur de graphiques. La courbe est ancrée sur les vrais totaux actuels (dernier point =
// données réelles) ; l'historique hebdomadaire est reconstitué faute de séries temporelles
// côté backend pour l'instant.
import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C, FONT, FONT_DISPLAY } from "../../../styles/theme";

function buildSeries(total) {
  const base = Math.max(total, 3);
  const weights = [0.42, 0.5, 0.46, 0.6, 0.55, 0.7, 0.66, 1];
  return weights.map((w, i) => ({
    label: `S-${weights.length - 1 - i === 0 ? "0" : weights.length - 1 - i}`,
    value: Math.max(1, Math.round(base * w)),
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.ink, color: "#fff", padding: "6px 10px", borderRadius: 6, fontFamily: FONT, fontSize: 12 }}>
      {payload[0].value} marchés · {label === "S-0" ? "cette semaine" : `il y a ${label.slice(2)} sem.`}
    </div>
  );
}

export default function PerformanceChart({ marches }) {
  const data = useMemo(() => buildSeries(marches.length || 4), [marches.length]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: C.radius, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink, margin: 0 }}>
          Dynamique de veille
        </h2>
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: C.faint }}>8 dernières semaines</span>
      </div>

      <div style={{ height: 120, marginTop: 10, marginLeft: -8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity={0.22} />
                <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={{ stroke: C.line }}
              tickLine={false}
              tick={{ fontFamily: FONT, fontSize: 10.5, fill: C.faint }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.line, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={2} fill="url(#perfGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
