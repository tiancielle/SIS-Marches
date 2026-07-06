// Thème partagé — palette et typographie.
// Direction : plat, professionnel, minimaliste (inspiré de TenderWatch).
// Pas d'ombres, pas de "cards" décoratives — juste des surfaces blanches et des bordures fines.

export const C = {
  // Fonds
  paper: "#F4F6FA",   // fond général de l'application
  card: "#FFFFFF",    // panneaux, tables, sidebar
  line: "#E4E8F0",    // bordures fines

  // Textes
  ink: "#12182B",     // texte principal
  mute: "#6B7280",    // texte secondaire
  faint: "#98A2B3",   // texte tertiaire / placeholders

  // Accent
  accent: "#2563EB",
  accentLt: "#EFF4FF",

  // États (texte uniquement, pas de pastilles colorées pleines)
  success: "#15803D",
  danger: "#B91C1C",
  warning: "#B45309",
};

export const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// À ajouter une fois dans index.html :
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
