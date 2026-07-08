import React from "react";
import { C } from "../../styles/theme";

// Surligne la portion de `text` qui correspond à `query`, sans librairie externe.
export default function Highlight({ text, query }) {
  if (!query) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <span style={{ background: C.accentLt, color: C.accent, fontWeight: 700, borderRadius: 2 }}>{match}</span>
      {after}
    </>
  );
}