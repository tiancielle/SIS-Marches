// Table générique réutilisable (tri, lignes cliquables, pagination) pour toutes les listes de l'appli.
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, FONT } from "../../styles/theme";

const PAGE_SIZE = 8;

export default function Table({ columns, rows, onRowClick }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.line}`, background: C.paper }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                textAlign: "left", padding: "11px 16px", fontSize: 11.5, fontWeight: 700,
                color: C.ink, textTransform: "uppercase", letterSpacing: 0.4,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)}
              style={{ borderBottom: `1px solid ${C.line}`, cursor: onRowClick ? "pointer" : "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.accentLt)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 500, color: C.ink }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: C.faint, fontSize: 13 }}>Aucun résultat</div>
      )}

      {rows.length > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: `1px solid ${C.line}` }}>
          <span style={{ fontFamily: FONT, fontSize: 12, color: C.mute }}>
            {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} sur {rows.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={current === 0}
              style={pagerBtn(current === 0)}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={current === pageCount - 1}
              style={pagerBtn(current === pageCount - 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const pagerBtn = (disabled) => ({
  width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.line}`,
  background: disabled ? C.paper : C.card, color: disabled ? C.faint : C.ink,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: disabled ? "default" : "pointer",
});