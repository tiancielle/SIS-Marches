import React from "react";
import { C } from "../../styles/theme";

export default function Skeleton({ width = "100%", height = 14, radius = 6, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${C.line} 25%, #EDEAE4 37%, ${C.line} 63%)`,
      backgroundSize: "400% 100%", animation: "sis-skeleton 1.4s ease infinite", ...style,
    }}>
      <style>{`@keyframes sis-skeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
    </div>
  );
}