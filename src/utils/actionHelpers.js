import { createPV } from './pvTemplate';


export const ACTION_TYPES = {
  DEMOLITION: {
    label: 'Démolition',
    color: 'red',
    icon: '🏗️',
    description: 'Démolition d\'habitat non réglementaire',
    requiresAmende: false
  },
  SIGNALEMENT: {
    label: 'Signalement',
    color: 'orange',
    icon: '⚠️',
    description: 'Signalement d\'infraction pour suivi',
    requiresAmende: false
  },
  NON_DEMOLITION: {
    label: 'Non-démolition',
    color: 'blue',
    icon: '🔄',
    description: 'Décision motivée de non-démolition',
    requiresAmende: false
  }
};

export const getActionTypeColor = (type) => ACTION_TYPES[type]?.color || 'default';
export const getActionTypeLabel = (type) => ACTION_TYPES[type]?.label || type;

export const generateActionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ACTION_${timestamp}_${random}`;
};

export const validateAction = (values, user, missions = [], douars = []) => {
  const errors = [];

  if (!values.type) errors.push('Type d\'action requis');
  if (!values.date) errors.push('Date d\'action requise');
  if (!values.observations || values.observations.trim().length < 10) {
    errors.push('Observations détaillées requises (minimum 10 caractères)');
  }

  if (values.cibleType && values.cibleId) {
    const cibles = values.cibleType === 'MISSION' ? missions : douars;
    const cible = cibles.find(c => c.id === values.cibleId);
    if (!cible) errors.push('Cible sélectionnée introuvable');
  }

  if (values.latitude && values.longitude) {
    const lat = parseFloat(values.latitude);
    const lng = parseFloat(values.longitude);
    if (lat < -90 || lat > 90) errors.push('Latitude invalide (doit être entre -90 et 90)');
    if (lng < -180 || lng > 180) errors.push('Longitude invalide (doit être entre -180 et 180)');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * ✅ Créer un "contenu" PV compatible avec PVEditor (objet simple)
 * (On ne renvoie pas le { content, metadata } du template ici.)
 */
export const createAutoPV = (action, mission, user, cible) => {
  return {
    date: action.dateAction || action.date || new Date().toISOString(),
    agent: user?.nom || user?.fullName || 'Agent d\'autorité',
    grade: 'Agent d\'autorité',
    mission: mission?.titre || 'Mission de contrôle',
    missionId: mission?.id || undefined,

    commune: action.commune || mission?.commune || '',
    prefecture: action.prefecture || mission?.prefecture || '',
    lieu: action.adresse || '',

    observations: action.observations || '',
    decisions: '',
    justification: '',

    coordinates: action?.geometry?.coordinates || null,
  };
};

export const canViewPV = (user, action) => {
  if (!user || !action) return false;
  if (user.role === 'GOUVERNEUR' || user.role === 'MEMBRE_DSI') return true;
  if (user.role === 'AGENT_AUTORITE') {
    return action.userId === user.id ||
           action.user?.id === user.id ||
           action.commune === user.commune;
  }
  return false;
};

export const calculateActionStats = (actions) => {
  const stats = {
    total: actions.length,
    demolitions: 0,
    signalements: 0,
    nonDemolitions: 0,
    withPV: 0,
    byStatus: { EN_ATTENTE: 0, EN_COURS: 0, TERMINEE: 0 },
    byCommune: {},
    recent: actions.filter(a => {
      const actionDate = new Date(a.date || a.dateAction);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return actionDate > weekAgo;
    }).length
  };

  actions.forEach(action => {
    switch(action.type) {
      case 'DEMOLITION': stats.demolitions++; break;
      case 'SIGNALEMENT': stats.signalements++; break;
      case 'NON_DEMOLITION': stats.nonDemolitions++; break;
    }
    if (action.pv) stats.withPV++;
    if (stats.byStatus[action.status] !== undefined) stats.byStatus[action.status]++;
    const commune = action.commune || 'Non spécifiée';
    stats.byCommune[commune] = (stats.byCommune[commune] || 0) + 1;
  });

  return stats;
};

export const filterActions = (actions, filters) => {
  let filtered = [...actions];
  if (filters.type) filtered = filtered.filter(a => a.type === filters.type);
  if (filters.status) filtered = filtered.filter(a => a.status === filters.status);
  if (filters.commune) filtered = filtered.filter(a => a.commune === filters.commune);
  if (filters.dateStart && filters.dateEnd) {
    const start = new Date(filters.dateStart);
    const end = new Date(filters.dateEnd);
    filtered = filtered.filter(a => {
      const actionDate = new Date(a.date || a.dateAction);
      return actionDate >= start && actionDate <= end;
    });
  }
  if (filters.userId) {
    filtered = filtered.filter(a => a.userId === filters.userId || a.user?.id === filters.userId);
  }
  return filtered;
};

export const formatActionForDisplay = (action, users = []) => {
  const user = users.find(u => u.id === (action.userId || action.user?.id));
  return {
    ...action,
    typeLabel: getActionTypeLabel(action.type),
    typeColor: getActionTypeColor(action.type),
    agentName: user?.nom || action.user?.name || 'Agent inconnu',
    dateFormatted: new Date(action.date || action.dateAction).toLocaleDateString('fr-FR'),
    hasPhotos: !!(action.photos && action.photos.length > 0),
    photoCount: action.photos?.length || 0,
    hasPV: !!action.pv,
    pvStatus: action.pv?.statut || null
  };
};

export default {
  ACTION_TYPES,
  getActionTypeColor,
  getActionTypeLabel,
  generateActionId,
  validateAction,
  createAutoPV,
  canViewPV,
  calculateActionStats,
  filterActions,
  formatActionForDisplay
};
