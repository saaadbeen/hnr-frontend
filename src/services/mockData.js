
export const PREFECTURES = [
  "Préfecture d'arrondissements de Casablanca-Anfa",
  "Préfecture d'arrondissements d'Aïn Chock", 
  "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
  "Préfecture d'arrondissements d'Al Fida-Mers Sultan",
  "Préfecture d'arrondissements de Ben M'sick",
  "Préfecture d'arrondissements de Moulay Rachid",
  "Préfecture d'arrondissements de Sidi Bernoussi",
  "Préfecture de Hay Hassani",
  "Préfecture de Mohammedia",
];

// Communes par préfecture (organisation officielle vérifiée)
export const COMMUNES_BY_PREFECTURE = {
  "Préfecture d'arrondissements de Casablanca-Anfa": ["Anfa", "Maârif", "Sidi Belyout"],
  "Préfecture d'arrondissements d'Aïn Chock": ["Aïn Chock"],
  "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi": ["Aïn Sebaâ", "Hay Mohammadi", "Roches Noires"],
  "Préfecture d'arrondissements d'Al Fida-Mers Sultan": ["Al Fida", "Mers Sultan"],
  "Préfecture d'arrondissements de Ben M'sick": ["Ben M'sick", "Sbata"],
  "Préfecture d'arrondissements de Moulay Rachid": ["Moulay Rachid", "Sidi Othmane"],
  "Préfecture d'arrondissements de Sidi Bernoussi": ["Sidi Bernoussi", "Sidi Moumen"],
  "Préfecture de Hay Hassani": ["Hay Hassani", "Essoukhour Assawda"],
  "Préfecture de Mohammedia": ["Mohammedia", "Ben Yakhlef"],
};

// Helper pour vérifier cohérence
export const isCommuneInPrefecture = (commune, prefecture) => {
  const list = COMMUNES_BY_PREFECTURE[prefecture] || [];
  return list.includes(commune);
};

// ===============================
// Utilisateurs avec coordonnées officielles
// ===============================
export const users = [
  {
    id: "user_dsi",
    nom: "membredsi",
    email: "membredsi@auc.ma",
    role: "MEMBRE_DSI",
    commune: "Anfa",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    telephone: "+212 6 12 34 56 78",
    createdAt: "2024-01-15T09:00:00.000Z",
  },
  {
    id: "user_gouverneur",
    nom: "gouverneur",
    email: "gouverneur@gouvernement.ma",
    role: "GOUVERNEUR",
    commune: "Anfa",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    telephone: "+212 6 11 22 33 44",
    createdAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "user_1",
    nom: "user1",
    email: "user1@casablanca.ma",
    role: "AGENT_AUTORITE",
    commune: "Maârif",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    telephone: "+212 6 98 76 54 32",
    createdAt: "2024-01-25T08:15:00.000Z",
  },
  {
    id: "user_2",
    nom: "user2",
    email: "user2@ainsebaa.ma",
    role: "AGENT_AUTORITE",
    commune: "Aïn Sebaâ",
    prefecture: "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
    telephone: "+212 6 55 44 33 22",
    createdAt: "2024-02-01T09:30:00.000Z",
  },
  {
    id: "user_3",
    nom: "user3",
    email: "user3@sidibernoussi.ma",
    role: "AGENT_AUTORITE",
    commune: "Sidi Bernoussi",
    prefecture: "Préfecture d'arrondissements de Sidi Bernoussi",
    telephone: "+212 6 77 88 99 00",
    createdAt: "2024-02-05T11:00:00.000Z",
  },
  {
    id: "user_4",
    nom: "user4",
    email: "user4@mohammedia.ma",
    role: "AGENT_AUTORITE",
    commune: "Mohammedia",
    prefecture: "Préfecture de Mohammedia",
    telephone: "+212 6 33 22 11 00",
    createdAt: "2024-02-10T14:45:00.000Z",
  },
];

// ===============================
// Douars avec coordonnées officielles vérifiées
// ===============================
export const douars = [
  {
    id: "douar_1",
    nom: "Douar Aïn Sebaâ Industriel",
    statut: "SIGNALE",
    commune: "Aïn Sebaâ",
    prefecture: "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
    center: { type: "Point", coordinates: [-7.540000, 33.610000] }, // lng, lat pour GeoJSON
    latitude: 33.610000, // Coordonnées officielles vérifiées
    longitude: -7.540000,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.541000, 33.609000],
        [-7.539000, 33.609000],
        [-7.539000, 33.611000],
        [-7.541000, 33.611000],
        [-7.541000, 33.609000],
      ]],
    },
    createdByUserId: "user_2",
    missionId: "mission_1",
    createdAt: "2024-01-20T09:00:00.000Z",
  },
  {
    id: "douar_2",
    nom: "Douar Maârif Centre",
    statut: "EN_COURS_TRAITEMENT",
    commune: "Maârif",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    center: { type: "Point", coordinates: [-7.627690, 33.567033] }, // Coordonnées officielles Maârif
    latitude: 33.567033,
    longitude: -7.627690,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.628690, 33.566033],
        [-7.626690, 33.566033],
        [-7.626690, 33.568033],
        [-7.628690, 33.568033],
        [-7.628690, 33.566033],
      ]],
    },
    createdByUserId: "user_1",
    missionId: "mission_2",
    createdAt: "2024-01-25T11:30:00.000Z",
  },
  {
    id: "douar_3",
    nom: "Douar Mohammedia Littoral",
    statut: "ERADIQUE",
    commune: "Mohammedia",
    prefecture: "Préfecture de Mohammedia",
    center: { type: "Point", coordinates: [-7.383000, 33.686100] }, // Coordonnées officielles Mohammedia
    latitude: 33.686100,
    longitude: -7.383000,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.384000, 33.685100],
        [-7.382000, 33.685100],
        [-7.382000, 33.687100],
        [-7.384000, 33.687100],
        [-7.384000, 33.685100],
      ]],
    },
    createdByUserId: "user_4",
    missionId: "mission_3",
    createdAt: "2024-01-15T14:20:00.000Z",
  },
  {
    id: "douar_4",
    nom: "Douar Sidi Bernoussi Sud",
    statut: "SIGNALE",
    commune: "Sidi Bernoussi",
    prefecture: "Préfecture d'arrondissements de Sidi Bernoussi",
    center: { type: "Point", coordinates: [-7.500000, 33.610000] }, // Coordonnées officielles Sidi Bernoussi
    latitude: 33.610000,
    longitude: -7.500000,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.501000, 33.609000],
        [-7.499000, 33.609000],
        [-7.499000, 33.611000],
        [-7.501000, 33.611000],
        [-7.501000, 33.609000],
      ]],
    },
    createdByUserId: "user_3",
    missionId: "mission_4",
    createdAt: "2024-02-01T10:00:00.000Z",
  },
  {
    id: "douar_5",
    nom: "Douar Ben M'sick Central",
    statut: "EN_COURS_TRAITEMENT",
    commune: "Ben M'sick",
    prefecture: "Préfecture d'arrondissements de Ben M'sick",
    center: { type: "Point", coordinates: [-7.581400, 33.554300] }, // Coordonnées officielles Ben M'sick
    latitude: 33.554300,
    longitude: -7.581400,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.582400, 33.553300],
        [-7.580400, 33.553300],
        [-7.580400, 33.555300],
        [-7.582400, 33.555300],
        [-7.582400, 33.553300],
      ]],
    },
    createdByUserId: "user_1",
    missionId: null,
    createdAt: "2024-02-05T14:30:00.000Z",
  },
  {
    id: "douar_6",
    nom: "Douar Hay Hassani Est",
    statut: "SIGNALE",
    commune: "Hay Hassani",
    prefecture: "Préfecture de Hay Hassani",
    center: { type: "Point", coordinates: [-7.620660, 33.570210] }, // Coordonnées officielles Hay Hassani
    latitude: 33.570210,
    longitude: -7.620660,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.621660, 33.569210],
        [-7.619660, 33.569210],
        [-7.619660, 33.571210],
        [-7.621660, 33.571210],
        [-7.621660, 33.569210],
      ]],
    },
    createdByUserId: "user_2",
    missionId: null,
    createdAt: "2024-02-08T09:15:00.000Z",
  },
];

// ===============================
// Missions avec coordonnées officielles vérifiées
// ===============================
export const missions = [
  {
    id: "mission_1",
    titre: "Contrôle Habitat Zone Industrielle Aïn Sebaâ",
    description:
      "Mission de contrôle des habitats non réglementaires dans la zone industrielle d'Aïn Sebaâ - Casablanca",
    status: "EN_COURS",
    commune: "Aïn Sebaâ",
    prefecture: "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
    dateDebut: "2024-02-01",
    dateFin: "2024-03-31",
    type: "POLYGON",
    center: { type: "Point", coordinates: [-7.540000, 33.610000] }, // Coordonnées officielles Aïn Sebaâ
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.542000, 33.608000],
        [-7.538000, 33.608000],
        [-7.538000, 33.612000],
        [-7.542000, 33.612000],
        [-7.542000, 33.608000],
      ]],
    },
    createdAt: "2024-01-28T14:30:00.000Z",
    createdBy: "user_2",
    assignedUsers: ["user_2"],
  },
  {
    id: "mission_2",
    titre: "Signalement Habitat Quartier Maârif",
    description:
      "Inspection et signalement des constructions d'habitat non réglementaires dans le quartier Maârif",
    status: "PLANIFIEE",
    commune: "Maârif",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    dateDebut: "2024-03-15",
    dateFin: "2024-04-15",
    type: "POLYGON",
    center: { type: "Point", coordinates: [-7.627690, 33.567033] }, // Coordonnées officielles Maârif
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.629690, 33.565033],
        [-7.625690, 33.565033],
        [-7.625690, 33.569033],
        [-7.629690, 33.569033],
        [-7.629690, 33.565033],
      ]],
    },
    createdAt: "2024-02-10T09:15:00.000Z",
    createdBy: "user_dsi",
    assignedUsers: ["user_1"],
  },
  {
    id: "mission_3",
    titre: "Surveillance Habitat Côte Mohammedia",
    description:
      "Surveillance des habitats non réglementaires sur la côte de Mohammedia",
    status: "TERMINEE",
    commune: "Mohammedia",
    prefecture: "Préfecture de Mohammedia",
    dateDebut: "2024-01-15",
    dateFin: "2024-02-15",
    type: "POLYGON",
    center: { type: "Point", coordinates: [-7.383000, 33.686100] }, // Coordonnées officielles Mohammedia
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.385000, 33.684100],
        [-7.381000, 33.684100],
        [-7.381000, 33.688100],
        [-7.385000, 33.688100],
        [-7.385000, 33.684100],
      ]],
    },
    createdAt: "2024-01-10T16:45:00.000Z",
    createdBy: "user_4",
    assignedUsers: ["user_4"],
  },
  {
    id: "mission_4",
    titre: "Contrôle Habitat Sidi Bernoussi Périphérie",
    description:
      "Mission de contrôle des habitats précaires non autorisés à Sidi Bernoussi",
    status: "EN_COURS",
    commune: "Sidi Bernoussi",
    prefecture: "Préfecture d'arrondissements de Sidi Bernoussi",
    dateDebut: "2024-02-20",
    dateFin: "2024-04-20",
    type: "POLYGON",
    center: { type: "Point", coordinates: [-7.500000, 33.610000] }, // Coordonnées officielles Sidi Bernoussi
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-7.502000, 33.608000],
        [-7.498000, 33.608000],
        [-7.498000, 33.612000],
        [-7.502000, 33.612000],
        [-7.502000, 33.608000],
      ]],
    },
    createdAt: "2024-02-15T11:00:00.000Z",
    createdBy: "user_3",
    assignedUsers: ["user_3"],
  },
];

// ===============================
// Changements avec coordonnées officielles
// ===============================
export const changements = [
  {
    id: "changement_1",
    type: "EXTENSION_HORIZONTALE",
    description:
      "Extension horizontale non autorisée - Ajout de 2 pièces à l'habitat existant",
    surface: 45.5,
    dateDetection: "2024-02-10",
    dateBefore: "2024-01-15",
    dateAfter: "2024-02-10",
    commune: "Aïn Sebaâ",
    prefecture: "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
    statut: "DETECTE",
    douarId: "douar_1",
    photoBefore: "/images/changements/before_1.jpg",
    photoAfter: "/images/changements/after_1.jpg",
    detectedByUserId: "user_2",
    createdAt: "2024-02-10T10:30:00.000Z",
    geometry: { type: "Point", coordinates: [-7.540000, 33.610000] }, // Coordonnées officielles
  },
  {
    id: "changement_2",
    type: "EXTENSION_VERTICALE",
    description: "Construction d'un étage supplémentaire sans autorisation",
    surface: 80,
    dateDetection: "2024-02-15",
    dateBefore: "2024-01-20",
    dateAfter: "2024-02-15",
    commune: "Maârif",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    statut: "EN_TRAITEMENT",
    douarId: "douar_2",
    photoBefore: "/images/changements/before_2.jpg",
    photoAfter: "/images/changements/after_2.jpg",
    detectedByUserId: "user_1",
    createdAt: "2024-02-15T14:20:00.000Z",
    geometry: { type: "Point", coordinates: [-7.627690, 33.567033] }, // Coordonnées officielles Maârif
  },
  {
    id: "changement_3",
    type: "CONSTRUCTION_NOUVELLE",
    description: "Nouvelle construction d'habitat sans permis sur terrain vague",
    surface: 120,
    dateDetection: "2024-01-25",
    dateBefore: "2024-01-01",
    dateAfter: "2024-01-25",
    commune: "Mohammedia",
    prefecture: "Préfecture de Mohammedia",
    statut: "TRAITE",
    douarId: "douar_3",
    photoBefore: "/images/changements/before_3.jpg",
    photoAfter: "/images/changements/after_3.jpg",
    detectedByUserId: "user_4",
    createdAt: "2024-01-25T16:45:00.000Z",
    geometry: { type: "Point", coordinates: [-7.383000, 33.686100] }, // Coordonnées officielles Mohammedia
  },
  {
    id: "changement_4",
    type: "EXTENSION_HORIZONTALE",
    description:
      "Extension latérale non déclarée - Garage transformé en habitation",
    surface: 35,
    dateDetection: "2024-02-08",
    dateBefore: "2024-01-10",
    dateAfter: "2024-02-08",
    commune: "Sidi Bernoussi",
    prefecture: "Préfecture d'arrondissements de Sidi Bernoussi",
    statut: "DETECTE",
    douarId: "douar_4",
    photoBefore: "/images/changements/before_4.jpg",
    photoAfter: "/images/changements/after_4.jpg",
    detectedByUserId: "user_3",
    createdAt: "2024-02-08T11:15:00.000Z",
    geometry: { type: "Point", coordinates: [-7.500000, 33.610000] }, // Coordonnées officielles Sidi Bernoussi
  },
];

// ===============================
// Actions avec coordonnées officielles
// ===============================
export const actions = [
  {
    id: "action_1",
    type: "DEMOLITION",
    date: "2024-02-15",
    observations:
      "Construction non autorisée (~150 m²). Démolition effectuée selon les procédures légales après mise en demeure.",
    commune: "Aïn Sebaâ",
    prefecture: "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi",
    douarId: "douar_1",
    missionId: "mission_1",
    userId: "user_2",
    user: { id: "user_2", name: "user2", email: "user2@ainsebaa.ma" },
    createdAt: "2024-02-15T11:30:00.000Z",
    createdBy: "user_2",
    status: "TERMINEE",
    geometry: { type: "Point", coordinates: [-7.540000, 33.610000] }, // Coordonnées officielles Aïn Sebaâ
  },
  {
    id: "action_2",
    type: "SIGNALEMENT",
    date: "2024-02-18",
    observations:
      "Extension verticale suspecte détectée. Dossier transmis aux services techniques pour évaluation.",
    commune: "Maârif",
    prefecture: "Préfecture d'arrondissements de Casablanca-Anfa",
    douarId: "douar_2",
    missionId: "mission_2",
    userId: "user_1",
    user: { id: "user_1", name: "user1", email: "user1@casablanca.ma" },
    createdAt: "2024-02-18T14:45:00.000Z",
    createdBy: "user_1",
    status: "EN_COURS",
    geometry: { type: "Point", coordinates: [-7.627690, 33.567033] }, // Coordonnées officielles Maârif
  },
  {
    id: "action_3",
    type: "NON_DEMOLITION",
    date: "2024-01-30",
    observations:
      "Après contrôle, la situation a été régularisée sans démolition (mise en conformité).",
    commune: "Mohammedia",
    prefecture: "Préfecture de Mohammedia",
    douarId: "douar_3",
    missionId: "mission_3",
    userId: "user_4",
    user: { id: "user_4", name: "user4", email: "user4@mohammedia.ma" },
    createdAt: "2024-01-30T16:20:00.000Z",
    createdBy: "user_4",
    status: "TERMINEE",
    geometry: { type: "Point", coordinates: [-7.383000, 33.686100] }, // Coordonnées officielles Mohammedia
  },
];

// ===============================
// Fichiers
// ===============================
export const fichiers = [
  {
    id: "fichier_1",
    fileName: "photo_avant_douar_ain_sebaa_industriel.jpg",
    filePath: "/uploads/images/2024/02/photo_avant_douar_ain_sebaa_industriel.jpg",
    url: "/images/changements/before_1.jpg",
    contentType: "image/jpeg",
    size: 2048576,
    entityType: "CHANGEMENT",
    entityId: "changement_1",
    changementId: "changement_1",
    uploadedByUserId: "user_2",
    uploadedAt: "2024-02-10T10:00:00.000Z",
  },
  {
    id: "fichier_2",
    fileName: "photo_apres_douar_ain_sebaa_industriel.jpg",
    filePath: "/uploads/images/2024/02/photo_apres_douar_ain_sebaa_industriel.jpg",
    url: "/images/changements/after_1.jpg",
    contentType: "image/jpeg",
    size: 2156748,
    entityType: "CHANGEMENT",
    entityId: "changement_1",
    changementId: "changement_1",
    uploadedByUserId: "user_2",
    uploadedAt: "2024-02-10T10:05:00.000Z",
  },
  {
    id: "fichier_3",
    fileName: "pv_demolition_ain_sebaa.pdf",
    filePath: "/uploads/documents/2024/02/pv_demolition_ain_sebaa.pdf",
    url: "/documents/pv/pv_demolition_ain_sebaa.pdf",
    contentType: "application/pdf",
    size: 512000,
    entityType: "ACTION",
    entityId: "action_1",
    actionId: "action_1",
    uploadedByUserId: "user_2",
    uploadedAt: "2024-02-15T11:45:00.000Z",
  },
];

// ===============================
// PV (Procès-Verbaux)
// ===============================
export const pvs = [
  {
    id: "pv_1",
    contenu: `PROCÈS-VERBAL DE DÉMOLITION

Type: Démolition
Date: 15/02/2024
Agent: user2
Commune: Aïn Sebaâ
Préfecture: Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi
Coordonnées GPS: 33.610000, -7.540000 (WGS84)

CONSTATATIONS:
Construction non autorisée dans la zone industrielle d'Aïn Sebaâ.
Extension réalisée sans respect des normes d'urbanisme en vigueur.
Mise en demeure délivrée le 01/02/2024 restée sans effet.

DÉCISION:
Démolition effectuée selon les procédures légales en vigueur.

Fait le 15/02/2024 à Casablanca
L'agent d'autorité,
user2`,
    dateRedaction: "2024-02-15T11:30:00.000Z",
    valide: true,
    urlPDF: "/documents/pv/pv_demolition_ain_sebaa.pdf",
    actionId: "action_1",
    redacteurUserId: "user_2",
    validateurUserId: "user_gouverneur",
    dateValidation: "2024-02-15T15:00:00.000Z",
    createdAt: "2024-02-15T11:30:00.000Z",
  },
  {
    id: "pv_2",
    contenu: `PROCÈS-VERBAL DE SIGNALEMENT

Type: Signalement
Date: 18/02/2024
Agent: user1
Commune: Maârif
Préfecture: Préfecture d'arrondissements de Casablanca-Anfa
Coordonnées GPS: 33.567033, -7.627690 (WGS84)

CONSTATATIONS:
Extension verticale non conforme détectée par surveillance satellitaire.
Construction d'un étage supplémentaire sans autorisation préalable.
Surface estimée: 80 m² supplémentaires.

DÉCISION:
Signalement aux services techniques compétents pour évaluation.
Ouverture d'une procédure d'enquête urbanistique.

Fait le 18/02/2024 à Casablanca
L'agent d'autorité,
user1`,
    dateRedaction: "2024-02-18T14:45:00.000Z",
    valide: false,
    urlPDF: "/documents/pv/pv_signalement_maarif.pdf",
    actionId: "action_2",
    redacteurUserId: "user_1",
    validateurUserId: null,
    dateValidation: null,
    createdAt: "2024-02-18T14:45:00.000Z",
  },
];

// ===============================
// Stats dashboard (calculées dynamiquement)
// ===============================
export const dashboardStats = {
  totalDouars: douars.length,
  douarsSignales: douars.filter((d) => d.statut === "SIGNALE").length,
  douarsEnTraitement: douars.filter((d) => d.statut === "EN_COURS_TRAITEMENT").length,
  douarsEradiques: douars.filter((d) => d.statut === "ERADIQUE").length,

  totalMissions: missions.length,
  missionsEnCours: missions.filter((m) => m.status === "EN_COURS").length,
  missionsPlanifiees: missions.filter((m) => m.status === "PLANIFIEE").length,
  missionsTerminees: missions.filter((m) => m.status === "TERMINEE").length,

  totalActions: actions.length,
  actionsDemolition: actions.filter((a) => a.type === "DEMOLITION").length,
  actionsSignalement: actions.filter((a) => a.type === "SIGNALEMENT").length,
  actionsNonDemolition: actions.filter((a) => a.type === "NON_DEMOLITION").length,

  totalChangements: changements.length,
  changementsDetectes: changements.filter((c) => c.statut === "DETECTE").length,
  changementsEnTraitement: changements.filter((c) => c.statut === "EN_TRAITEMENT").length,
  changementsTraites: changements.filter((c) => c.statut === "TRAITE").length,

  totalPVs: pvs.length,
  pvsValides: pvs.filter((p) => p.valide).length,
  pvsEnAttente: pvs.filter((p) => !p.valide).length,

  totalUtilisateurs: users.length,
  agentsAutorite: users.filter((u) => u.role === "AGENT_AUTORITE").length,
  membresDSI: users.filter((u) => u.role === "MEMBRE_DSI").length,
  gouverneurs: users.filter((u) => u.role === "GOUVERNEUR").length,

  // Stats par préfecture
  prefectureStats: Object.keys(COMMUNES_BY_PREFECTURE).reduce((stats, prefecture) => {
    const communes = COMMUNES_BY_PREFECTURE[prefecture];
    const prefectureData = [...douars, ...actions, ...changements].filter(item => 
      communes.includes(item.commune)
    );
    stats[prefecture] = {
      totalItems: prefectureData.length,
      communes: communes.length,
      agents: users.filter(u => u.prefecture === prefecture && u.role === "AGENT_AUTORITE").length
    };
    return stats;
  }, {})
};

// ===============================
// Export par défaut
// ===============================
export default {
  PREFECTURES,
  COMMUNES_BY_PREFECTURE,
  isCommuneInPrefecture,
  users,
  douars,
  missions,
  changements,
  actions,
  fichiers,
  pvs,
  dashboardStats,
};