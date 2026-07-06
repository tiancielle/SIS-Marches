// Table générique réutilisable (tri, lignes cliquables) pour Projets et Sous-traitants.
import React from "react";
import { C, FONT } from "../../styles/theme";

// Tableau générique — aucune "card", juste des lignes sur fond blanc avec bordures fines.
export default function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.line}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: C.mute,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              style={{ borderBottom: `1px solid ${C.line}`, cursor: onRowClick ? "pointer" : "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.paper)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 16px", fontSize: 13.5, color: C.ink }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: C.faint, fontSize: 13 }}>
          Aucun résultat
        </div>
      )}
    </div>
  );
}