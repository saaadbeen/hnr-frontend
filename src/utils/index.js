

import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
dayjs.locale('fr');

// --- Organisation administrative ---
export const ARRONDISSEMENTS_COMMUNES = {
  "Casablanca-Anfa": ["Anfa", "Maârif", "Sidi Belyout"],
  "Aïn Chock": ["Aïn Chock"],
  "Aïn Sebaâ-Hay Mohammadi": ["Aïn Sebaâ", "Hay Mohammadi", "Roches Noires"],
  "Al Fida-Mers Sultan": ["Al Fida", "Mers Sultan"],
  "Ben M'sick": ["Ben M'sick", "Sbata"],
  "Moulay Rachid": ["Moulay Rachid", "Sidi Othmane"],
  "Sidi Bernoussi": ["Sidi Bernoussi", "Sidi Moumen"],
  "Hay Hassani": ["Hay Hassani", "Essoukhour Assawda"]
};

export const PREFECTURES_INDEPENDANTES = {
  "Mohammedia": ["Mohammedia", "Ben Yakhlef"]
};

export const COORDONNEES_COMMUNES = {
  "Anfa": { lat: 33.590000, lng: -7.664000 },
  "Maârif": { lat: 33.567033, lng: -7.627690 },
  "Sidi Belyout": { lat: 33.614600, lng: -7.578800 },
  "Aïn Chock": { lat: 33.551800, lng: -7.591700 },
  "Aïn Sebaâ": { lat: 33.610000, lng: -7.540000 },
  "Hay Mohammadi": { lat: 33.606830, lng: -7.523240 },
  "Roches Noires": { lat: 33.600404, lng: -7.587565 },
  "Al Fida": { lat: 33.577000, lng: -7.557000 },
  "Mers Sultan": { lat: 33.575928, lng: -7.615309 },
  "Ben M'sick": { lat: 33.554300, lng: -7.581400 },
  "Sbata": { lat: 33.543700, lng: -7.564000 },
  "Moulay Rachid": { lat: 33.581900, lng: -7.504900 },
  "Sidi Othmane": { lat: 33.557000, lng: -7.560400 },
  "Sidi Bernoussi": { lat: 33.610000, lng: -7.500000 },
  "Sidi Moumen": { lat: 33.574700, lng: -7.535800 },
  "Hay Hassani": { lat: 33.570210, lng: -7.620660 },
  "Essoukhour Assawda": { lat: 33.591667, lng: -7.595833 },
  "Mohammedia": { lat: 33.686100, lng: -7.383000 },
  "Ben Yakhlef": { lat: 33.668100, lng: -7.251390 },
  "Mansouria": { lat: 33.750000, lng: -7.300000 }
};

export const PREFECTURES_ARRONDISSEMENTS = {
  "Préfecture d'arrondissements de Casablanca-Anfa": "Casablanca-Anfa",
  "Préfecture d'arrondissements d'Aïn Chock": "Aïn Chock",
  "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi": "Aïn Sebaâ-Hay Mohammadi",
  "Préfecture d'arrondissements d'Al Fida-Mers Sultan": "Al Fida-Mers Sultan",
  "Préfecture d'arrondissements de Ben M'sick": "Ben M'sick",
  "Préfecture d'arrondissements de Moulay Rachid": "Moulay Rachid",
  "Préfecture d'arrondissements de Sidi Bernoussi": "Sidi Bernoussi",
  "Préfecture de Hay Hassani": "Hay Hassani",
  "Préfecture de Mohammedia": "Mohammedia"
};

const PREFECTURE_NOMS_COURTS = {
  "Préfecture d'arrondissements de Casablanca-Anfa": "Casablanca",
  "Préfecture d'arrondissements d'Aïn Chock": "Casablanca",
  "Préfecture d'arrondissements d'Aïn Sebaâ-Hay Mohammadi": "Casablanca",
  "Préfecture d'arrondissements d'Al Fida-Mers Sultan": "Casablanca",
  "Préfecture d'arrondissements de Ben M'sick": "Casablanca",
  "Préfecture d'arrondissements de Moulay Rachid": "Casablanca",
  "Préfecture d'arrondissements de Sidi Bernoussi": "Casablanca",
  "Préfecture de Hay Hassani": "Casablanca",
  "Préfecture de Mohammedia": "Mohammedia"
};

const COMMUNE_ALIASES = {
  "Maarif": "Maârif",
  "Mâarif": "Maârif",
  "Ain Chock": "Aïn Chock",
  "Ain Sebaa": "Aïn Sebaâ",
  "Roches-Noires": "Roches Noires",
  "Sidi Belyoute": "Sidi Belyout",
  "Sidi Bel Yout": "Sidi Belyout"
};

export const normalizeCommuneName = (raw) => {
  if (!raw) return raw;
  const trimmed = String(raw).trim();
  return COMMUNE_ALIASES[trimmed] || trimmed;
};

export const normalizePrefectureName = (p) => {
  if (!p) return p;
  return PREFECTURE_NOMS_COURTS[p] || (p.includes("Casablanca") ? "Casablanca" : p);
};

export const getArrondissementFromCommune = (communeRaw) => {
  const commune = normalizeCommuneName(communeRaw);
  for (const [arrondissement, communes] of Object.entries(ARRONDISSEMENTS_COMMUNES)) {
    if (communes.includes(commune)) return arrondissement;
  }
  for (const [prefecture, communes] of Object.entries(PREFECTURES_INDEPENDANTES)) {
    if (communes.includes(commune)) return prefecture;
  }
  return null;
};

export const getCommunesFromArrondissement = (arrondissement) =>
  ARRONDISSEMENTS_COMMUNES[arrondissement] || PREFECTURES_INDEPENDANTES[arrondissement] || [];

export const getPrefectureFromCommune = (communeRaw) => {
  const arrondissement = getArrondissementFromCommune(communeRaw);
  if (!arrondissement) return null;
  for (const [prefecture, arr] of Object.entries(PREFECTURES_ARRONDISSEMENTS)) {
    if (arr === arrondissement) return prefecture;
  }
  if (arrondissement === "Mohammedia") return "Préfecture de Mohammedia";
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

export const toLeafletLatLng = (geojsonPoint) => {
  if (!geojsonPoint || geojsonPoint.type !== 'Point' || !Array.isArray(geojsonPoint.coordinates)) return null;
  const [lng, lat] = geojsonPoint.coordinates;
  return { lat, lng };
};

export const toGeoJSONPoint = (lat, lng) => ({
  type: 'Point',
  coordinates: [lng, lat]
});

export const getStatsByArrondissement = (data) => {
  const stats = {};
  Object.keys(ARRONDISSEMENTS_COMMUNES).forEach(arr => {
    const communes = getCommunesFromArrondissement(arr);
    const arrData = data.filter(item => communes.includes(normalizeCommuneName(item.commune)));
    stats[arr] = { total: arrData.length, communes: communes.length, data: arrData };
  });
  Object.keys(PREFECTURES_INDEPENDANTES).forEach(pref => {
    const communes = getCommunesFromArrondissement(pref);
    const prefData = data.filter(item => communes.includes(normalizeCommuneName(item.commune)));
    stats[pref] = { total: prefData.length, communes: communes.length, data: prefData };
  });
  return stats;
};

export const groupDataByArrondissement = (data) => {
  const grouped = {};
  Object.keys(ARRONDISSEMENTS_COMMUNES).forEach(arr => (grouped[arr] = []));
  Object.keys(PREFECTURES_INDEPENDANTES).forEach(pref => (grouped[pref] = []));
  data.forEach(item => {
    const arr = getArrondissementFromCommune(item.commune);
    if (arr && grouped[arr]) grouped[arr].push(item);
  });
  return grouped;
};

export const filterDataByUserPermissions = (data, user) => {
  if (!user || !Array.isArray(data)) return [];
  if (user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR') return data;
  if (user.role === 'AGENT_AUTORITE') {
    return data.filter(item => canUserViewChange(user, item) || canUserViewAction(user, item));
  }
  return [];
};


export const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  getItem(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? defaultValue : raw;
    } catch {
      return defaultValue;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : String(value));
    } catch {}
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  getJSON(key, defaultValue = null) {
    return this.get(key, defaultValue);
  },
  setJSON(key, value) {
    this.set(key, value);
  },
};

export const formatDate = (input, format = 'DD/MM/YYYY HH:mm') => {
  if (!input) return '';
  const d = typeof input === 'string' || typeof input === 'number' ? dayjs(input) : dayjs(input);
  if (!d.isValid()) return '';
  return d.format(format);
};

export const getRelativeTime = (input) => {
  if (!input) return '';
  const d = dayjs(input);
  return d.isValid() ? d.fromNow() : '';
};

export const formatNumber = (n, options = {}) => {
  try {
    return new Intl.NumberFormat('fr-FR', options).format(n);
  } catch {
    return String(n ?? '');
  }
};

export const debounce = (fn, wait = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

export const parseQueryString = (qs) => {
  const search = typeof qs === 'string' ? qs : (typeof window !== 'undefined' ? window.location.search : '');
  const out = {};
  if (!search || search[0] !== '?') return out;
  const params = new URLSearchParams(search);
  params.forEach((v, k) => {
    if (out[k] !== undefined) out[k] = Array.isArray(out[k]) ? [...out[k], v] : [out[k], v];
    else out[k] = v;
  });
  return out;
};

export const isReadOnly = (userOrRole) => {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  return role === 'GOUVERNEUR';
};

export default {
  ARRONDISSEMENTS_COMMUNES,
  PREFECTURES_INDEPENDANTES,
  COORDONNEES_COMMUNES,
  PREFECTURES_ARRONDISSEMENTS,
  normalizeCommuneName,
  normalizePrefectureName,
  getArrondissementFromCommune,
  getCommunesFromArrondissement,
  getPrefectureFromCommune,
  getPrefectureShortFromCommune,
  areCommunesSameArrondissement,
  getCommuneCoordinates,
  getArrondissementCenter,
  getCommuneBounds,
  getArrondissementBounds,
  isChangeInAgentArea,
  canUserViewChange,
  canUserViewAction,
  formatArrondissementName,
  getVisibleCommunesForUser,
  toLeafletLatLng,
  toGeoJSONPoint,
  getStatsByArrondissement,
  groupDataByArrondissement,
  filterDataByUserPermissions,
  storage,
  formatDate,
  getRelativeTime,
  formatNumber,
  debounce,
  parseQueryString,
  isReadOnly,
};
