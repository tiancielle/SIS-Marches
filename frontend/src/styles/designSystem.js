// Design System - Palette et Tokens inspirés de Notion/Linear
export const COLORS = {
  // Statuts workflow - Palette sobre
  interesse: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" }, // Gris
  en_preparation: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" }, // Orange
  pret_a_deposer: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" }, // Violet
  soumis: { bg: "#EFF6FF", text: "#2563EB", border: "#93C5FD" }, // Bleu
  gagne: { bg: "#F0FDF4", text: "#16A34A", border: "#86EFAC" }, // Vert
  perdu: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" }, // Rouge
  abandonne: { bg: "#FEF2F2", text: "#991B1B", border: "#F87171" }, // Rouge foncé
  ignore: { bg: "#1F2937", text: "#F3F4F6", border: "#374151" }, // Gris foncé (archivé)
  
  // Alias pour compatibilité
  preparation: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" },
  depose: { bg: "#EFF6FF", text: "#2563EB", border: "#93C5FD" },
  rejet: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
  
  // KPIs
  success: "#16A34A",
  warning: "#C2410C",
  danger: "#DC2626",
  info: "#2563EB",
  
  // UI
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceAlt: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  text: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  textMuted: "#CBD5E1",
  
  // Accents
  primary: "#243746",
  primaryLight: "#E4E7E9",
  accent: "#2563EB",
  accentLight: "#DBEAFE",
};

export const TYPOGRAPHY = {
  h1: { fontSize: 20, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.3 },
  h2: { fontSize: 16, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.2 },
  h3: { fontSize: 14, fontWeight: 600, lineHeight: 1.4, letterSpacing: -0.1 },
  h4: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
  small: { fontSize: 11, fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: 10, fontWeight: 500, lineHeight: 1.3 },
  tiny: { fontSize: 9, fontWeight: 500, lineHeight: 1.2 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
};

export const BORDERS = {
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export const SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
  lg: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
  xl: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
};

export const TRANSITIONS = {
  fast: "150ms ease",
  normal: "200ms ease",
  slow: "300ms ease",
};
