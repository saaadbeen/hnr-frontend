import { message, notification } from 'antd'

export const DEFAULT_GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 300000
}

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
}

export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
}

export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

export const getGeolocationErrorMessage = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        title: 'Autorisation refusée',
        description: 'Veuillez autoriser l\'accès à votre position dans les paramètres du navigateur'
      };
    case error.POSITION_UNAVAILABLE:
      return {
        title: 'Position indisponible',
        description: 'Impossible de déterminer votre position. Vérifiez que le GPS est activé'
      };
    case error.TIMEOUT:
      return {
        title: 'Délai dépassé',
        description: 'La localisation prend trop de temps. Réessayez ou saisissez manuellement'
      };
    default:
      return {
        title: 'Erreur de géolocalisation',
        description: 'Une erreur inconnue s\'est produite lors de la localisation'
      };
  }
}

export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Géolocalisation non supportée par ce navigateur'));
      return;
    }

    const finalOptions = {
      ...DEFAULT_GEOLOCATION_OPTIONS,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        resolve({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          altitude,
          heading,
          speed,
          timestamp: new Date(position.timestamp)
        });
      },
      (error) => {
        reject(error);
      },
      finalOptions
    );
  });
}

export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!isGeolocationSupported()) {
    errorCallback?.(new Error('Géolocalisation non supportée'));
    return null;
  }

  const finalOptions = {
    ...DEFAULT_GEOLOCATION_OPTIONS,
    ...options
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({
        latitude: parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        accuracy: Math.round(accuracy),
        timestamp: new Date(position.timestamp)
      });
    },
    (error) => {
      errorCallback?.(error);
    },
    finalOptions
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

export const getCurrentPositionWithUI = async (options = {}) => {
  const {
    showLoadingMessage = true,
    showSuccessMessage = false,
    showErrorNotification = true,
    loadingMessage = 'Localisation en cours...',
    successMessage = 'Position obtenue',
    ...geoOptions
  } = options;

  let hideLoading;
  
  if (showLoadingMessage) {
    hideLoading = message.loading(loadingMessage, 0);
  }

  try {
    const position = await getCurrentPosition(geoOptions);
    
    if (hideLoading) hideLoading();

    if (showSuccessMessage) {
      message.success({
        content: `${successMessage}: ${formatCoordinates(position.latitude, position.longitude, 'short')}`,
        duration: 2
      });
    }

    return position;
  } catch (error) {
    if (hideLoading) hideLoading();

    if (showErrorNotification) {
      const errorMsg = getGeolocationErrorMessage(error);
      notification.error({
        message: errorMsg.title,
        description: errorMsg.description,
        duration: 5
      });
    }

    throw error;
  }
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
}

export const isWithinRadius = (centerLat, centerLon, targetLat, targetLon, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLon, targetLat, targetLon);
  return distance <= radiusKm;
}

export const formatCoordinates = (latitude, longitude, format = 'decimal') => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return 'Coordonnées invalides';
  }

  switch (format) {
    case 'decimal':
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    case 'dms':
      const latDMS = convertToDMS(latitude, 'lat');
      const lonDMS = convertToDMS(longitude, 'lon');
      return `${latDMS}, ${lonDMS}`;
    case 'short':
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    default:
      return `${latitude}, ${longitude}`;
  }
}

const convertToDMS = (decimal, type) => {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
  const direction = decimal >= 0 ? 
    (type === 'lat' ? 'N' : 'E') : 
    (type === 'lat' ? 'S' : 'W');
  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

export const validateCoordinates = (latitude, longitude) => {
  const errors = [];
  if (latitude === null || latitude === undefined || isNaN(latitude)) {
    errors.push('Latitude manquante ou invalide');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('Latitude doit être entre -90 et 90');
  }
  if (longitude === null || longitude === undefined || isNaN(longitude)) {
    errors.push('Longitude manquante ou invalide');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('Longitude doit être entre -180 et 180');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

export const getLocationWithFallback = async (options = {}) => {
  try {
    return await getCurrentPositionWithUI({
      ...options,
      showErrorNotification: false
    });
  } catch (gpsError) {
    console.warn('GPS indisponible:', gpsError.message);
    const gpsErrorMsg = getGeolocationErrorMessage(gpsError);
    notification.warning({
      message: 'Géolocalisation GPS indisponible',
      description: `${gpsErrorMsg.description} Veuillez saisir manuellement les coordonnées ou cliquer sur la carte.`,
      duration: 6
    });
    throw gpsError;
  }
}

export const isInMorocco = (latitude, longitude) => {
  const bounds = {
    north: 36.0,
    south: 21.0,
    east: -1.0,
    west: -17.0
  };
  return latitude >= bounds.south && 
         latitude <= bounds.north && 
         longitude >= bounds.west && 
         longitude <= bounds.east;
}

export const isInCasablancaRegion = (latitude, longitude) => {
  const bounds = {
    north: 34.0,
    south: 32.5,
    east: -6.5,
    west: -8.5
  };
  return latitude >= bounds.south && 
         latitude <= bounds.north && 
         longitude >= bounds.west && 
         longitude <= bounds.east;
}

export const getCommuneCoordinates = (commune) => {
  return COORDONNEES_COMMUNES[commune] || null;
}

export const getCommuneBounds = (commune) => {
  const coords = getCommuneCoordinates(commune);
  if (!coords) return null;
  const offset = 0.018;
  return {
    north: coords.lat + offset,
    south: coords.lat - offset,
    east: coords.lng + offset,
    west: coords.lng - offset
  };
}

export const isInCommuneArea = (latitude, longitude, commune) => {
  const bounds = getCommuneBounds(commune);
  if (!bounds) {
    return isInCasablancaRegion(latitude, longitude);
  }
  return latitude >= bounds.south && 
         latitude <= bounds.north && 
         longitude >= bounds.west && 
         longitude <= bounds.east;
}

export const getCommunesGroupCenter = (communes) => {
  const coords = communes
    .map(commune => getCommuneCoordinates(commune))
    .filter(Boolean);
  if (coords.length === 0) return null;
  const lat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
  const lng = coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length;
  return { lat, lng };
}

export const getCommunesGroupBounds = (communes) => {
  const coords = communes
    .map(commune => getCommuneCoordinates(commune))
    .filter(Boolean);
  if (coords.length === 0) return null;
  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);
  return {
    north: Math.max(...lats) + 0.01,
    south: Math.min(...lats) - 0.01,
    east: Math.max(...lngs) + 0.01,
    west: Math.min(...lngs) - 0.01
  };
}

export const createGeolocationHook = () => {
  return {
    getCurrentPosition: getCurrentPositionWithUI,
    watchPosition,
    calculateDistance,
    formatCoordinates,
    validateCoordinates,
    isSupported: isGeolocationSupported(),
    isSecureContext: isSecureContext()
  };
};

export default {
  DEFAULT_GEOLOCATION_OPTIONS,
  COORDONNEES_COMMUNES,
  isGeolocationSupported,
  isSecureContext,
  getCurrentPosition,
  getCurrentPositionWithUI,
  getLocationWithFallback,
  watchPosition,
  calculateDistance,
  isWithinRadius,
  formatCoordinates,
  validateCoordinates,
  getGeolocationErrorMessage,
  isInMorocco,
  isInCasablancaRegion,
  getCommuneCoordinates,
  getCommuneBounds,
  isInCommuneArea,
  getCommunesGroupCenter,
  getCommunesGroupBounds,
  createGeolocationHook
}
