import React from "react";
import { C, FONT } from "../../styles/theme";

export default function Field({ label, value, onChange, required, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontFamily: FONT, fontSize: 12, color: C.mute,
        marginBottom: 5, fontWeight: 600
      }}>
        {label} {required && <span style={{ color: C.danger }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", fontFamily: FONT, fontSize: 13.5, color: C.ink,
          padding: "8px 11px", borderRadius: 6, border: `1px solid ${C.line}`,
          background: C.paper, boxSizing: "border-box", outline: "none",
        }}
      />
    </div>
  );
}