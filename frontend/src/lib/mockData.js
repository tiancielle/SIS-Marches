export const SEED_PROJETS = [
  { id: 1, nom: "Résidence Yasmine", client: "Groupe Amal Immobilier", lieu: "Rabat — Hay Riad", budget: 4200000, debut: "2025-02-01", fin: "2025-11-30", statut: "actif", chef: "I. Bennani" },
  { id: 2, nom: "Centre d'affaires Atlas", client: "Atlas Invest", lieu: "Casablanca — Sidi Maarouf", budget: 1500000, debut: "2025-03-15", fin: "2025-09-15", statut: "actif", chef: "N. Fassi" },
  { id: 3, nom: "Villa Souissi", client: "Particulier", lieu: "Rabat — Souissi", budget: 350000, debut: "2024-09-01", fin: "2025-01-30", statut: "termine", chef: "I. Bennani" },
  { id: 4, nom: "Lotissement Al Amal", client: "OCP Habitat", lieu: "El Jadida", budget: 2100000, debut: "2024-01-10", fin: "2024-06-20", statut: "termine", chef: "N. Fassi" },
  { id: 5, nom: "Centre d'affaires Atlas", client: "Atlas Invest", lieu: "Casablanca — Sidi Maarouf", budget: 7500000, debut: "2025-03-15", fin: "2026-02-15", statut: "actif", chef: "N.Filali" },
];

// Relation projet ↔ sous-traitant : seulement l'ID + les infos propres au contrat.
// Les infos du sous-traitant (nom, spécialité...) viennent uniquement de SEED_SUBS.
export const SEED_SUBS_BY_PROJECT = {
  1: [
    { subId: 1, contratRef: "CT-2025-014", document: true },
    { subId: 2, contratRef: null, document: false },
  ],
  2: [{ subId: 2, contratRef: "CT-2025-021", document: true }],
  3: [],
  4: [{ subId: 1, contratRef: "CT-2024-006", document: true }],
};

export const SEED_SUBS = [
  { id: 1, name: "Atlas BTP", specialite: "Gros œuvre", contact: "K. Benali", email: "k.benali@atlasbtp.ma", phone: "+212 661 11 22 33", ice: "001789456000012" },
  { id: 2, name: "ElectroNord", specialite: "Électricité", contact: "S. Idrissi", email: "contact@electronord.ma", phone: "+212 662 44 55 66", ice: "002345678000034" },
  { id: 3, name: "Plomberie Générale du Sud", specialite: "Plomberie", contact: "H. Zouiten", email: "contact@pgs.ma", phone: "+212 663 78 90 12", ice: "003456789000056" },
];

// Fusionne la relation (subId, contrat) avec les vraies infos du sous-traitant depuis SEED_SUBS
export const getSubsForProject = (projectId) =>
  (SEED_SUBS_BY_PROJECT[projectId] || []).map((entry) => {
    const sub = SEED_SUBS.find((s) => s.id === entry.subId);
    return { ...sub, contratRef: entry.contratRef, document: entry.document };
  });

export const subProjectCount = (subId) =>
  Object.values(SEED_SUBS_BY_PROJECT).filter((list) => list.some((entry) => entry.subId === subId)).length;

export const projectsForSub = (subId) =>
  SEED_PROJETS.filter((p) => (SEED_SUBS_BY_PROJECT[p.id] || []).some((entry) => entry.subId === subId));


export const SEED_HISTORY_BY_PROJECT = {
  1: [
    { id: 1, date: "2025-02-01", label: "Projet créé", detail: "Statut initial : Actif" },
    { id: 2, date: "2025-04-10", label: "Sous-traitant affecté", detail: "ElectroNord ajouté au projet" },
    { id: 3, date: "2025-05-02", label: "Contrat signé", detail: "CT-2025-014 avec Atlas BTP" },
  ],
  3: [
    { id: 1, date: "2024-09-01", label: "Projet créé", detail: "Statut initial : Actif" },
    { id: 2, date: "2025-01-30", label: "Projet clôturé", detail: "Statut changé en Terminé" },
  ],
};

export const SEED_EQUIPE = [
  { id: 1, nom: "Y. Alaoui", intitule: "Chef de projet junior", type: "interne", email: "y.alaoui@sis.ma", phone: "+212 661 22 33 44" },
  { id: 2, nom: "R. Cherkaoui", intitule: "Ingénieur études", type: "interne", email: "r.cherkaoui@sis.ma", phone: "+212 662 33 44 55" },
  { id: 3, nom: "M. Belhaj", intitule: "Consultant BTP", type: "freelance", email: "m.belhaj@gmail.com", phone: "+212 663 44 55 66" },
];

export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " DH";
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const SEED_MARCHES = [
  {
    id: 1, reference: "AO-2026-0342", objet: "Prestations d'assistance technique pour la digitalisation des services administratifs",
    organisme: "Ministère de la Transition Numérique", date_limite_remise: "2026-08-15",
    montant_estimatif: 1800000, type_procedure: "Appel d'offres ouvert",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-10", statut: "analyse",
  },
  {
    id: 2, reference: "AO-2026-0356", objet: "Construction et aménagement d'un centre de formation professionnelle",
    organisme: "OFPPT — Direction Régionale Rabat-Salé-Kénitra", date_limite_remise: "2026-07-22",
    montant_estimatif: 6400000, type_procedure: "Appel d'offres ouvert",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-12", statut: "nouveau",
  },
  {
    id: 3, reference: "AO-2026-0361", objet: "Mission de conseil en organisation et accompagnement au changement",
    organisme: "Agence Nationale de la Conservation Foncière", date_limite_remise: "2026-08-02",
    montant_estimatif: 950000, type_procedure: "Appel d'offres ouvert",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-14", statut: "analyse",
  },
  {
    id: 4, reference: "AO-2026-0368", objet: "Réhabilitation et extension du réseau d'assainissement — lot 2",
    organisme: "Commune de Salé", date_limite_remise: "2026-09-05",
    montant_estimatif: 12500000, type_procedure: "Appel d'offres ouvert",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-15", statut: "nouveau",
  },
  {
    id: 5, reference: "AO-2026-0372", objet: "Assistance à maîtrise d'ouvrage pour un programme de logements sociaux",
    organisme: "Al Omrane — Direction Régionale de Casablanca", date_limite_remise: "2026-07-21",
    montant_estimatif: 2300000, type_procedure: "Appel d'offres restreint",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-16", statut: "nouveau",
  },
  {
    id: 6, reference: "AO-2026-0375", objet: "Étude de faisabilité pour la modernisation d'un parc d'activités industrielles",
    organisme: "Région Casablanca-Settat", date_limite_remise: "2026-08-28",
    montant_estimatif: 1450000, type_procedure: "Appel d'offres ouvert",
    url_avis: "https://www.marchespublics.gov.ma", url_cps: "",
    date_import: "2026-07-17", statut: "nouveau",
  },
];

// Analyses IA — simulées côté frontend en attendant l'endpoint LLM backend
// (même logique que la fonction analyserMarche dans DataContext).
export const SEED_ANALYSES = [
  {
    id: 1, marche_public_id: 1,
    resume: "Marché portant sur : Prestations d'assistance technique pour la digitalisation des services administratifs...",
    mots_cles: ["digitalisation", "assistance technique", "secteur public"],
    technologies_detectees: ["gestion documentaire", "conseil organisationnel"],
    score_pertinence: 94,
    justification: "Correspond étroitement au cœur de métier de SIS Consultants (conseil et accompagnement à la transformation des organisations publiques).",
    recommandations: "Marché prioritaire — préparer le dossier de candidature dès maintenant.",
    modele_utilise: "simulation-frontend",
    date_analyse: "2026-07-11",
  },
  {
    id: 2, marche_public_id: 3,
    resume: "Marché portant sur : Mission de conseil en organisation et accompagnement au changement...",
    mots_cles: ["conseil en organisation", "conduite du changement"],
    technologies_detectees: ["diagnostic organisationnel"],
    score_pertinence: 87,
    justification: "Correspond directement à l'expertise conseil de SIS Consultants.",
    recommandations: "Bon fit — vérifier les critères d'éligibilité avant remise.",
    modele_utilise: "simulation-frontend",
    date_analyse: "2026-07-15",
  },
];






