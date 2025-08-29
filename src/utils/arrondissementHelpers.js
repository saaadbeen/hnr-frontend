
export const ARRONDISSEMENTS_COMMUNES = {
  "Casablanca-Anfa": ["Anfa", "Maârif", "Sidi Belyout"],
  "Aïn Sebaâ-Hay Mohammadi": ["Aïn Sebaâ", "Hay Mohammadi", "Roches Noires"],
  "Sidi Bernoussi": ["Sidi Bernoussi", "Sidi Moumen"],
  "Ben M'sick": ["Ben M'sick", "Sbata"],
  "Moulay Rachid": ["Moulay Rachid", "Sidi Othmane"],
  "Al Fida-Mers Sultan": ["Al Fida", "Mers Sultan"],
  "Aïn Chock": ["Aïn Chock"],
  "Hay Hassani": ["Hay Hassani", "Essoukhour Assawda"],
  "Mohammedia": ["Mohammedia", "Ben Yakhlef", "Mansouria"]
};

//
//
const COMMUNE_ALIASES = {
  "Maarif": "Maârif",
  "Mâarif": "Maârif",
  "Ain Chock": "Aïn Chock",
  "Ain Sebaa": "Aïn Sebaâ",
  "Roches-Noires": "Roches Noires",
  "Sidi Belyoute": "Sidi Belyout",
  "Sidi Bel Yout": "Sidi Belyout",
};

export const normalizeCommuneName = (raw) => {
  if (!raw) return raw;
  const trimmed = String(raw).trim();
  return COMMUNE_ALIASES[trimmed] || trimmed;
};

//
//
export const COORDONNEES_COMMUNES = {
  "Anfa": { lat: 33.5803, lng: -7.6144 },
  "Maârif": { lat: 33.5670, lng: -7.6277 },
  "Sidi Belyout": { lat: 33.5984, lng: -7.6139 },

  "Aïn Chock": { lat: 33.5371, lng: -7.5982 },
  "Aïn Sebaâ": { lat: 33.5940, lng: -7.5314 },
  "Hay Mohammadi": { lat: 33.5731, lng: -7.5898 },
  "Roches Noires": { lat: 33.600404, lng: -7.587565 },

  "Al Fida": { lat: 33.576944, lng: -7.557222 },
  "Mers Sultan": { lat: 33.580000, lng: -7.600000 },
  "Ben M'sick": { lat: 33.554300, lng: -7.581400 },
  "Sbata": { lat: 33.543056, lng: -7.553611 },
  "Moulay Rachid": { lat: 33.559444, lng: -7.541944 },
  "Sidi Othmane": { lat: 33.567500, lng: -7.542500 },
  "Sidi Bernoussi": { lat: 33.600000, lng: -7.499722 },
  "Sidi Moumen": { lat: 33.574664, lng: -7.535833 },
  "Hay Hassani": { lat: 33.546389, lng: -7.680278 },
  "Essoukhour Assawda": { lat: 33.591667, lng: -7.595833 },

  "Mohammedia": { lat: 33.683509, lng: -7.384855 },
  "Ben Yakhlef": { lat: 33.683000, lng: -7.333000 },
  "Mansouria": { lat: 33.739586, lng: -7.291590 }
};

//
//
export const PREFECTURES_ARRONDISSEMENTS = {
  "Préfecture d'arrondissements de Casablanca-Anfa": "Casablanca-Anfa",
  "Préfecture d'arrondissements Aïn Sebaâ-Hay Mohammadi": "Aïn Sebaâ-Hay Mohammadi", 
  "Préfecture d'arrondissements de Sidi Bernoussi": "Sidi Bernoussi",
  "Préfecture d'arrondissements de Ben M'sick": "Ben M'sick",
  "Préfecture d'arrondissements de Moulay Rachid": "Moulay Rachid",
  "Préfecture d'arrondissements Al Fida-Mers Sultan": "Al Fida-Mers Sultan",
  "Préfecture d'arrondissements d'Aïn Chock": "Aïn Chock",
  "Préfecture de Hay Hassani": "Hay Hassani",
  "Préfecture de Mohammedia": "Mohammedia"
};

const PREF_SHORT = {
  "Préfecture d'arrondissements de Casablanca-Anfa": "Casablanca",
  "Préfecture d'arrondissements Aïn Sebaâ-Hay Mohammadi": "Casablanca",
  "Préfecture d'arrondissements de Sidi Bernoussi": "Casablanca",
  "Préfecture d'arrondissements de Ben M'sick": "Casablanca",
  "Préfecture d'arrondissements de Moulay Rachid": "Casablanca",
  "Préfecture d'arrondissements Al Fida-Mers Sultan": "Casablanca",
  "Préfecture d'arrondissements d'Aïn Chock": "Casablanca",
  "Préfecture de Hay Hassani": "Casablanca",
  "Préfecture de Mohammedia": "Mohammedia"
};

export const normalizePrefectureName = (p) => {
  if (!p) return p;
  const hit = Object.keys(PREF_SHORT).find(k => k === p);
  return hit ? PREF_SHORT[hit] : (p.includes("Casablanca") ? "Casablanca" : p);
};

//
//
export const getArrondissementFromCommune = (communeRaw) => {
  const commune = normalizeCommuneName(communeRaw);
  for (const [arrondissement, communes] of Object.entries(ARRONDISSEMENTS_COMMUNES)) {
    if (communes.includes(commune)) return arrondissement;
  }
  return null;
};

export const getCommunesFromArrondissement = (arrondissement) =>
  ARRONDISSEMENTS_COMMUNES[arrondissement] || [];

export const getPrefectureFromCommune = (communeRaw) => {
  const arrondissement = getArrondissementFromCommune(communeRaw);
  if (!arrondissement) return null;
  for (const [prefecture, arr] of Object.entries(PREFECTURES_ARRONDISSEMENTS)) {
    if (arr === arrondissement) return prefecture;$
  }
  return null;
};

export const getPrefectureShortFromCommune = (communeRaw) => {
  const full = getPrefectureFromCommune(communeRaw);
  return normalizePrefectureName(full);
};

export const areCommunesSameArrondissement = (c1, c2) => {
  const arr1 = getArrondissementFromCommune(c1);
  const arr2 = getArrondissementFromCommune(c2);
  return arr1 && arr2 && arr1 === arr2;
};

export const isChangeInAgentArea = (item, userCommune, userPrefecture) => {
  if (!item || !userCommune) return false;
  const c = normalizeCommuneName(item.commune);
  const u = normalizeCommuneName(userCommune);

  if (c === u) return true;
  if (areCommunesSameArrondissement(c, u)) return true;
  const pref = normalizePrefectureName(item.prefecture);
  const upref = normalizePrefectureName(userPrefecture);
  if (pref && upref && pref === upref) return true;
  return false;
};

export const canUserViewChange = (user, changement) => {
  if (!user || !changement) return false;
  if (user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR') return true;
  if (user.role === 'AGENT_AUTORITE') {
    return isChangeInAgentArea(changement, user.commune, user.prefecture);
  }
  return false;
};

export const canUserViewAction = (user, action) => {
  if (!user || !action) return false;
  if (user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR') return true;
  if (user.role === 'AGENT_AUTORITE') {
    return (
      action.userId === user.id ||
      action.user?.id === user.id ||
      isChangeInAgentArea(action, user.commune, user.prefecture)
    );
  }
  return false;
};

export const getCommuneCoordinates = (communeRaw) =>
  COORDONNEES_COMMUNES[normalizeCommuneName(communeRaw)] || null;

export const getArrondissementCenter = (arrondissement) => {
  const communes = getCommunesFromArrondissement(arrondissement);
  if (!communes.length) return null;
  const coords = communes.map(getCommuneCoordinates).filter(Boolean);
  if (!coords.length) return null;
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat, lng };
};

export const getVisibleCommunesForUser = (user, allData = []) => {
  if (!user) return [];
  if (user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR') {
    return [...new Set(allData.map(d => normalizeCommuneName(d.commune)))].filter(Boolean).sort();
  }
  if (user.role === 'AGENT_AUTORITE') {
    const arr = getArrondissementFromCommune(user.commune);
    return arr ? getCommunesFromArrondissement(arr) : [normalizeCommuneName(user.commune)];
  }
  return [];
};

export const getArrondissementBounds = (arrondissement) => {
  const communes = getCommunesFromArrondissement(arrondissement);
  const coords = communes.map(getCommuneCoordinates).filter(Boolean);
  if (!coords.length) return null;
  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);
  const padding = 0.02; 
  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding
  };
};

export const getCommuneBounds = (communeRaw) => {
  const coords = getCommuneCoordinates(communeRaw);
  if (!coords) return null;
  const padding = 0.015; 
  return {
    north: coords.lat + padding,
    south: coords.lat - padding,
    east: coords.lng + padding,
    west: coords.lng - padding
  };
};

export const formatArrondissementName = (arrondissement) => {
  const shortNames = {
    "Casablanca-Anfa": "Anfa",
    "Aïn Sebaâ-Hay Mohammadi": "Aïn Sebaâ",
    "Al Fida-Mers Sultan": "Al Fida",
    "Moulay Rachid": "M. Rachid",
    "Sidi Bernoussi": "S. Bernoussi",
    "Ben M'sick": "Ben M'sick",
    "Aïn Chock": "Aïn Chock",
    "Hay Hassani": "H. Hassani",
    "Mohammedia": "Mohammedia"
  };
  return shortNames[arrondissement] || arrondissement;
};

export const getStatsByArrondissement = (data) => {
  const stats = {};
  Object.keys(ARRONDISSEMENTS_COMMUNES).forEach(arr => {
    const communes = getCommunesFromArrondissement(arr);
    const arrData = data.filter(item => communes.includes(normalizeCommuneName(item.commune)));
    stats[arr] = { total: arrData.length, communes: communes.length, data: arrData };
  });
  return stats;
};

export const getZoomRadiusForArrondissement = (arrondissement) => {
  const b = getArrondissementBounds(arrondissement);
  if (!b) return 2000;
  const latDiff = b.north - b.south;
  const lngDiff = b.east - b.west;
  const maxDiff = Math.max(latDiff, lngDiff);
  return Math.max(1000, (maxDiff * 111000) / 2);
};

export const isPointInArrondissement = (lat, lng, arrondissement) => {
  const b = getArrondissementBounds(arrondissement);
  if (!b) return false;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
};

export const findNearestArrondissement = (lat, lng) => {
  let nearest = null;
  let min = Infinity;
  Object.keys(ARRONDISSEMENTS_COMMUNES).forEach(arr => {
    const c = getArrondissementCenter(arr);
    if (!c) return;
    const d = Math.hypot(lat - c.lat, lng - c.lng);
    if (d < min) { min = d; nearest = arr; }
  });
  return nearest;
};

export const getCommuneInfo = (communeRaw) => {
  const commune = normalizeCommuneName(communeRaw);
  const arrondissement = getArrondissementFromCommune(commune);
  const prefecture = getPrefectureFromCommune(commune);
  const coordinates = getCommuneCoordinates(commune);
  const bounds = getCommuneBounds(commune);
  return {
    commune,
    arrondissement,
    prefecture,
    prefectureShort: normalizePrefectureName(prefecture),
    coordinates,
    bounds,
    communesSoeurs: arrondissement ? getCommunesFromArrondissement(arrondissement).filter(c => c !== commune) : []
  };
};

export const filterDataByUserPermissions = (data, user) => {
  if (!user || !Array.isArray(data)) return [];
  if (user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR') return data;
  if (user.role === 'AGENT_AUTORITE') {
    return data.filter(item => canUserViewChange(user, item) || canUserViewAction(user, item));
  }
  return [];
};

export const groupDataByArrondissement = (data) => {
  const grouped = {};
  Object.keys(ARRONDISSEMENTS_COMMUNES).forEach(arr => (grouped[arr] = []));
  data.forEach(item => {
    const arr = getArrondissementFromCommune(item.commune);
    if (arr && grouped[arr]) grouped[arr].push(item);
  });
  return grouped;
};

//

//
export const toLeafletLatLng = (geojsonPoint) => {
  if (!geojsonPoint || geojsonPoint.type !== 'Point' || !Array.isArray(geojsonPoint.coordinates)) return null;
  const [lng, lat] = geojsonPoint.coordinates;
  return { lat, lng };
};

export const toGeoJSONPoint = (lat, lng) => ({
  type: 'Point',
  coordinates: [lng, lat] // longitude, puis latitude (RFC 7946)
});

export default {
  ARRONDISSEMENTS_COMMUNES,
  COORDONNEES_COMMUNES,
  PREFECTURES_ARRONDISSEMENTS,
  normalizeCommuneName,
  normalizePrefectureName,
  getArrondissementFromCommune,
  getCommunesFromArrondissement,
  getPrefectureFromCommune,
  getPrefectureShortFromCommune,
  areCommunesSameArrondissement,
  canUserViewChange,
  canUserViewAction,
  isChangeInAgentArea,
  getCommuneCoordinates,
  getArrondissementCenter,
  getVisibleCommunesForUser,
  getArrondissementBounds,
  getCommuneBounds,
  formatArrondissementName,
  getStatsByArrondissement,
  getZoomRadiusForArrondissement,
  isPointInArrondissement,
  findNearestArrondissement,
  getCommuneInfo,
  filterDataByUserPermissions,
  groupDataByArrondissement,
  toLeafletLatLng,
  toGeoJSONPoint
};
