import { useState, useEffect, useCallback } from 'react';
import {
  users as initialUsers,
  missions as initialMissions,
  changements as initialChangements,
  douars as initialDouars,
  actions as initialActions,
  pvs as initialPVs,
} from './mockData';
import { getCommuneCoordinates } from '../utils/geolocationHelpers';

/* --------------------------
  Helpers de normalisation avec coordonnées officielles
--------------------------- */
const CASA_ARR = [
  'Anfa', 'Maârif', 'Sidi Bernoussi', 'Aïn Sebaâ',
  'Aïn Chock', 'Hay Hassani', "Ben M'sick",
  'Sidi Othmane', 'Mers Sultan', 'Al Fida', 'Moulay Rachid',
  'Hay Mohammadi', 'Roches Noires', 'Sidi Belyout', 'Sbata',
  'Sidi Moumen', 'Essoukhour Assawda'
];
const MOH_ARR = ['Mohammedia', 'Ben Yakhlef', 'Mansouria'];

function normalizeCommune(commune) {
  if (!commune) return commune;
  if (CASA_ARR.includes(commune)) return 'Casablanca';
  if (MOH_ARR.includes(commune)) return 'Mohammedia';
  return commune;
}

function normalizePrefecture(prefecture) {
  if (!prefecture) return prefecture;
  if (prefecture === 'Casablanca-Settat') return 'Casablanca';
  return prefecture;
}

/* --------------------------
  Organisation administrative avec coordonnées officielles
--------------------------- */
const ARRONDISSEMENTS_COMMUNES = {
  "Casablanca-Anfa": ["Anfa", "Maârif", "Sidi Belyout"],
  "Aïn Sebaâ-Hay Mohammadi": ["Aïn Sebaâ", "Hay Mohammadi", "Roches Noires"],
  "Sidi Bernoussi": ["Sidi Bernoussi", "Sidi Moumen"],
  "Ben M'sick": ["Ben M'sick", "Sbata"],
  "Moulay Rachid": ["Moulay Rachid", "Sidi Othmane"],
  "Al Fida-Mers Sultan": ["Al Fida", "Mers Sultan"],
  "Aïn Chock": ["Aïn Chock"],
  "Hay Hassani": ["Hay Hassani", "Essoukhour Assawda"],
  "Mohammedia": ["Mohammedia", "Ben Yakhlef"]
};


class MockApiService {
  constructor() {
    // Collections en mémoire
    this.users = [...initialUsers];
    this.missions = [...initialMissions];
    this.changements = [...initialChangements];
    this.douars = [...initialDouars];
    this.actions = [...initialActions];
    this.pvs = [...initialPVs];

    this.listeners = new Set();
    
    // Vérifier et corriger les coordonnées au démarrage
    this.validateAndFixCoordinates();
  }

  /**
   * Valider et corriger les coordonnées avec les données officielles
   */
  validateAndFixCoordinates() {
    console.log('🗺️ Validation et correction des coordonnées avec les données officielles...');
    
    let correctionCount = 0;

    // Corriger les douars
    this.douars.forEach(douar => {
      const officialCoords = getCommuneCoordinates(douar.commune);
      if (officialCoords) {
        // Vérifier si les coordonnées actuelles sont très différentes des officielles
        const currentLat = douar.latitude || (douar.center?.coordinates?.[1]);
        const currentLng = douar.longitude || (douar.center?.coordinates?.[0]);
        
        if (!currentLat || !currentLng || 
            Math.abs(currentLat - officialCoords.lat) > 0.01 || 
            Math.abs(currentLng - officialCoords.lng) > 0.01) {
          
          // Mise à jour avec coordonnées officielles + petit offset aléatoire
          const offsetLat = (Math.random() - 0.5) * 0.004; // ~200m max
          const offsetLng = (Math.random() - 0.5) * 0.004;
          
          douar.latitude = officialCoords.lat + offsetLat;
          douar.longitude = officialCoords.lng + offsetLng;
          douar.center = { 
            type: "Point", 
            coordinates: [douar.longitude, douar.latitude] 
          };
          
          correctionCount++;
        }
      }
    });

    // Corriger les missions
    this.missions.forEach(mission => {
      const officialCoords = getCommuneCoordinates(mission.commune);
      if (officialCoords && mission.center) {
        const [currentLng, currentLat] = mission.center.coordinates;
        
        if (Math.abs(currentLat - officialCoords.lat) > 0.01 || 
            Math.abs(currentLng - officialCoords.lng) > 0.01) {
          
          mission.center.coordinates = [officialCoords.lng, officialCoords.lat];
          correctionCount++;
        }
      }
    });

    // Corriger les changements
    this.changements.forEach(changement => {
      if (changement.geometry?.type === 'Point') {
        const officialCoords = getCommuneCoordinates(changement.commune);
        if (officialCoords) {
          const [currentLng, currentLat] = changement.geometry.coordinates;
          
          if (Math.abs(currentLat - officialCoords.lat) > 0.01 || 
              Math.abs(currentLng - officialCoords.lng) > 0.01) {
            
            const offsetLat = (Math.random() - 0.5) * 0.003;
            const offsetLng = (Math.random() - 0.5) * 0.003;
            
            changement.geometry.coordinates = [
              officialCoords.lng + offsetLng,
              officialCoords.lat + offsetLat
            ];
            correctionCount++;
          }
        }
      }
    });

    // Corriger les actions
    this.actions.forEach(action => {
      if (action.geometry?.type === 'Point') {
        const officialCoords = getCommuneCoordinates(action.commune);
        if (officialCoords) {
          const [currentLng, currentLat] = action.geometry.coordinates;
          
          if (Math.abs(currentLat - officialCoords.lat) > 0.01 || 
              Math.abs(currentLng - officialCoords.lng) > 0.01) {
            
            const offsetLat = (Math.random() - 0.5) * 0.002;
            const offsetLng = (Math.random() - 0.5) * 0.002;
            
            action.geometry.coordinates = [
              officialCoords.lng + offsetLng,
              officialCoords.lat + offsetLat
            ];
            correctionCount++;
          }
        }
      }
    });

    if (correctionCount > 0) {
      console.log(`✅ ${correctionCount} coordonnées corrigées avec les données officielles`);
      this.notifyListeners();
    }
  }

  async delay(ms = 300) { 
    return new Promise((resolve) => setTimeout(resolve, ms)); 
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() { 
    this.listeners.forEach((callback) => callback()); 
  }

  /* ======= HELPERS GÉOGRAPHIQUES AVEC COORDONNÉES OFFICIELLES ======= */
  
  // Déterminer l'arrondissement d'une commune avec validation
  getArrondissementFromCommune(commune) {
    for (const [arrondissement, communes] of Object.entries(ARRONDISSEMENTS_COMMUNES)) {
      if (communes.includes(commune)) {
        return arrondissement;
      }
    }
    return null;
  }

  // Vérifier si un changement est dans la zone d'un agent avec coordonnées
  isChangeInAgentArea(changement, userCommune, userPrefecture) {
    if (!changement || !userCommune) return false;

    // Vérification par commune exacte
    if (changement.commune === userCommune) return true;

    // Vérification par arrondissement
    const changementArrondissement = this.getArrondissementFromCommune(changement.commune);
    const userArrondissement = this.getArrondissementFromCommune(userCommune);

    if (changementArrondissement && userArrondissement && changementArrondissement === userArrondissement) {
      return true;
    }

    // Vérification par préfecture (fallback)
    if (changement.prefecture === userPrefecture) return true;

    return false;
  }

  // Générer des coordonnées cohérentes pour une commune
  generateCommuneCoordinates(commune) {
    const officialCoords = getCommuneCoordinates(commune);
    if (officialCoords) {
      // Ajouter un petit offset aléatoire pour éviter les doublons exacts
      const offsetLat = (Math.random() - 0.5) * 0.003; // ~150m max
      const offsetLng = (Math.random() - 0.5) * 0.003;
      
      return {
        lat: officialCoords.lat + offsetLat,
        lng: officialCoords.lng + offsetLng,
        official: true
      };
    }
    
    // Fallback sur Anfa si commune inconnue
    console.warn(`⚠️ Coordonnées non trouvées pour ${commune}, utilisation d'Anfa par défaut`);
    const anfaCoords = getCommuneCoordinates('Anfa');
    return {
      lat: anfaCoords.lat + (Math.random() - 0.5) * 0.01,
      lng: anfaCoords.lng + (Math.random() - 0.5) * 0.01,
      official: false
    };
  }

  /* ======= DOUARS ======= */
  async getDouars() { 
    await this.delay(); 
    return [...this.douars]; 
  }

  async getDouarById(id) { 
    await this.delay(); 
    return this.douars.find((d) => d.id === id); 
  }

  async createDouar(data) {
    await this.delay();
    
    // Générer des coordonnées officielles
    const coords = this.generateCommuneCoordinates(data.commune);
    
    const newItem = { 
      id: `douar_${Date.now()}`, 
      ...data,
      latitude: coords.lat,
      longitude: coords.lng,
      center: { type: "Point", coordinates: [coords.lng, coords.lat] },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [coords.lng - 0.001, coords.lat - 0.001],
          [coords.lng + 0.001, coords.lat - 0.001],
          [coords.lng + 0.001, coords.lat + 0.001],
          [coords.lng - 0.001, coords.lat + 0.001],
          [coords.lng - 0.001, coords.lat - 0.001],
        ]],
      },
      createdAt: new Date().toISOString(),
      officialCoordinates: coords.official
    };
    
    this.douars.push(newItem); 
    this.notifyListeners(); 
    return newItem;
  }

  async updateDouar(id, data) {
    await this.delay();
    const index = this.douars.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Douar non trouvé');
    
    // Si la commune change, mettre à jour les coordonnées
    if (data.commune && data.commune !== this.douars[index].commune) {
      const coords = this.generateCommuneCoordinates(data.commune);
      data.latitude = coords.lat;
      data.longitude = coords.lng;
      data.center = { type: "Point", coordinates: [coords.lng, coords.lat] };
      data.officialCoordinates = coords.official;
    }
    
    this.douars[index] = { ...this.douars[index], ...data }; 
    this.notifyListeners(); 
    return this.douars[index];
  }

  async deleteDouar(id) {
    await this.delay();
    const index = this.douars.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Douar non trouvé');
    this.douars.splice(index, 1); 
    this.notifyListeners(); 
    return true;
  }

  /* ======= UTILISATEURS ======= */
  async getUsers() { 
    await this.delay(); 
    return [...this.users]; 
  }

  async getUserById(id) { 
    await this.delay(); 
    return this.users.find((u) => u.id === id); 
  }

  async createUser(userData) {
    await this.delay();
    
    // Valider la cohérence commune/préfecture avec coordonnées
    if (userData.commune && userData.prefecture) {
      const officialCoords = getCommuneCoordinates(userData.commune);
      if (!officialCoords) {
        console.warn(`⚠️ Commune ${userData.commune} non reconnue dans les coordonnées officielles`);
      }
    }
    
    const newUser = { 
      id: `user_${Date.now()}`, 
      ...userData, 
      createdAt: new Date().toISOString() 
    };
    this.users.push(newUser); 
    this.notifyListeners(); 
    return newUser;
  }

  async updateUser(id, userData) {
    await this.delay();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Utilisateur non trouvé');
    this.users[index] = { ...this.users[index], ...userData }; 
    this.notifyListeners(); 
    return this.users[index];
  }

  async deleteUser(id) {
    await this.delay();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Utilisateur non trouvé');
    this.users.splice(index, 1); 
    this.notifyListeners(); 
    return true;
  }

  async getAgentsByCommune(commune, prefecture) {
    await this.delay();
    const normCommune = normalizeCommune(commune);
    const normPref = normalizePrefecture(prefecture);

    return this.users.filter((u) => {
      if (u.role !== 'AGENT_AUTORITE') return false;
      const communeOK = !!normCommune && (u.commune === normCommune || u.commune === commune);
      const prefOK =
        !normPref ||
        u.prefecture === normPref ||
        u.prefecture === prefecture ||
        (normPref === 'Casablanca' && u.prefecture?.includes('Casablanca'));
      return communeOK && prefOK;
    });
  }

  /* ======= MISSIONS AVEC COORDONNÉES OFFICIELLES ======= */
  async getMissions() { 
    await this.delay(); 
    return [...this.missions]; 
  }

  async getMissionById(id) { 
    await this.delay(); 
    return this.missions.find((m) => m.id === id); 
  }

  async createMission(missionData) {
    await this.delay();
    
    // Générer coordonnées officielles pour la mission
    const coords = this.generateCommuneCoordinates(missionData.commune);
    
    const newMission = { 
      id: `mission_${Date.now()}`, 
      ...missionData,
      center: { type: "Point", coordinates: [coords.lng, coords.lat] },
      geometry: missionData.geometry || {
        type: "Polygon",
        coordinates: [[
          [coords.lng - 0.002, coords.lat - 0.002],
          [coords.lng + 0.002, coords.lat - 0.002],
          [coords.lng + 0.002, coords.lat + 0.002],
          [coords.lng - 0.002, coords.lat + 0.002],
          [coords.lng - 0.002, coords.lat - 0.002],
        ]],
      },
      officialCoordinates: coords.official,
      createdAt: new Date().toISOString() 
    };
    
    this.missions.push(newMission); 
    this.notifyListeners(); 
    return newMission;
  }

  async updateMission(id, missionData) {
    await this.delay();
    const index = this.missions.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Mission non trouvée');
    
    // Si la commune change, mettre à jour les coordonnées
    if (missionData.commune && missionData.commune !== this.missions[index].commune) {
      const coords = this.generateCommuneCoordinates(missionData.commune);
      missionData.center = { type: "Point", coordinates: [coords.lng, coords.lat] };
      missionData.officialCoordinates = coords.official;
    }
    
    this.missions[index] = { ...this.missions[index], ...missionData }; 
    this.notifyListeners(); 
    return this.missions[index];
  }

  async deleteMission(id) {
    await this.delay();
    const index = this.missions.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Mission non trouvée');
    this.missions.splice(index, 1); 
    this.notifyListeners(); 
    return true;
  }

  /* ======= CHANGEMENTS AVEC FILTRAGE ET COORDONNÉES ======= */
  async getChangements() { 
    await this.delay(); 
    return [...this.changements]; 
  }

  async getChangementById(id) { 
    await this.delay(); 
    return this.changements.find((c) => c.id === id); 
  }

  // Méthode pour récupérer les changements filtrés selon le rôle
  async getChangesByUserRole(user) {
    await this.delay();

    const allChangements = [...this.changements];

    if (user?.role === 'AGENT_AUTORITE') {
      // Filtrer seulement les changements de sa zone
      return allChangements.filter(changement =>
        this.isChangeInAgentArea(changement, user.commune, user.prefecture)
      );
    }

    // DSI et Gouverneur voient tout
    return allChangements;
  }

  // Méthode pour récupérer les changements par arrondissement
  async getChangementsByArrondissement(arrondissement) {
    await this.delay();

    const communesArrondissement = ARRONDISSEMENTS_COMMUNES[arrondissement] || [];
    return this.changements.filter(c => 
      communesArrondissement.includes(c.commune)
    );
  }

  // Méthode pour récupérer les changements par commune
  async getChangementsByCommune(commune) {
    await this.delay();
    return this.changements.filter(c => c.commune === commune);
  }

  // Méthode pour récupérer les statistiques des changements par zone
  async getChangementsStatsByUser(user) {
    await this.delay();

    const changements = await this.getChangesByUserRole(user);

    return {
      total: changements.length,
      detectes: changements.filter(c => c.statut === 'DETECTE').length,
      enTraitement: changements.filter(c => c.statut === 'EN_TRAITEMENT').length,
      traites: changements.filter(c => c.statut === 'TRAITE').length,
      parCommune: changements.reduce((acc, c) => {
        acc[c.commune] = (acc[c.commune] || 0) + 1;
        return acc;
      }, {}),
      parType: changements.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  async createChangement(data) {
    await this.delay();
    
    // Générer coordonnées officielles
    const coords = this.generateCommuneCoordinates(data.commune);
    
    const newItem = { 
      id: `changement_${Date.now()}`, 
      ...data,
      geometry: data.geometry || { 
        type: "Point", 
        coordinates: [coords.lng, coords.lat] 
      },
      officialCoordinates: coords.official,
      createdAt: new Date().toISOString() 
    };
    
    this.changements.push(newItem); 
    this.notifyListeners(); 
    return newItem;
  }

  async updateChangement(id, data) {
    await this.delay();
    const index = this.changements.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Changement non trouvé');
    
    // Si la commune change, mettre à jour les coordonnées
    if (data.commune && data.commune !== this.changements[index].commune) {
      const coords = this.generateCommuneCoordinates(data.commune);
      data.geometry = { type: "Point", coordinates: [coords.lng, coords.lat] };
      data.officialCoordinates = coords.official;
    }
    
    this.changements[index] = { ...this.changements[index], ...data }; 
    this.notifyListeners(); 
    return this.changements[index];
  }

  async deleteChangement(id) {
    await this.delay();
    const index = this.changements.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Changement non trouvé');
    this.changements.splice(index, 1); 
    this.notifyListeners(); 
    return true;
  }

  /* ======= ACTIONS AVEC COORDONNÉES OFFICIELLES ======= */
  async getActions() { 
    await this.delay(); 
    return [...this.actions]; 
  }

  async getActionById(id) { 
    await this.delay(); 
    return this.actions.find((a) => a.id === id); 
  }

  async createAction(data) {
    await this.delay();

    // Validation minimale
    if (!data.type || !data.userId || !data.date) {
      throw new Error('Données manquantes: type, userId et date sont requis');
    }
    const validTypes = ['DEMOLITION', 'SIGNALEMENT', 'NON_DEMOLITION'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`Type d'action invalide. Types autorisés: ${validTypes.join(', ')}`);
    }

    // Géométrie (fallback coordonnées officielles si commune fournie)
    let geometry = data.geometry;
    let officialCoords = false;
    if (!geometry && data.commune) {
      const coords = this.generateCommuneCoordinates(data.commune);
      geometry = { type: "Point", coordinates: [coords.lng, coords.lat] };
      officialCoords = coords.official;
    }

    const newAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: data.type,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
      observations: data.observations || '',
      commune: data.commune || '',
      prefecture: data.prefecture || '',
      missionId: data.missionId || null,
      userId: data.userId,
      user: data.user || { id: data.userId, name: 'Agent' },
      geometry,
      photos: data.photos || [],
      status: data.status || 'EN_COURS',
      officialCoordinates: data.officialCoordinates || officialCoords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changementId: data.changementId || null,  // ← lien au changement
      ...data,
    };

    this.actions.push(newAction);

    // Lier au changement : passer EN_TRAITEMENT et mémoriser l’action
    if (newAction.changementId) {
      const idx = this.changements.findIndex(c => c.id === newAction.changementId);
      if (idx !== -1) {
        this.changements[idx] = {
          ...this.changements[idx],
          statut: 'EN_TRAITEMENT',
          linkedActionId: newAction.id,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // PV brouillon
    const pv = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      numero: this.generatePVNumber(newAction.type),
      type: newAction.type,
      statut: 'BROUILLON',
      createdAt: new Date().toISOString(),
      createdBy: newAction.userId,
      redacteurUserId: newAction.userId,
      validatedAt: null,
      validatedBy: null,
      actionId: newAction.id,
      action: newAction,
      contenu: {
        titre: `Procès-verbal ${this.getActionTypeLabel(newAction.type)}`,
        constatations: newAction.observations || '',
        decisions: '',
        coordonnees: geometry ? {
          latitude: geometry.coordinates[1],
          longitude: geometry.coordinates[0],
          source: newAction.officialCoordinates ? 'Coordonnées officielles vérifiées' : 'Géolocalisation estimée'
        } : null,
        photos: {
          before: newAction.photos?.find(p => p.slot === 'BEFORE') || null,
          after: newAction.photos?.find(p => p.slot === 'AFTER') || null,
        },
      },
    };

    this.pvs.push(pv);
    newAction.pvId = pv.id;

    this.notifyListeners();
    return newAction;
  }

  async updateAction(id, data) {
    await this.delay();
    
    const index = this.actions.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Action non trouvée');
    }

    if (data.type) {
      const validTypes = ['DEMOLITION', 'SIGNALEMENT', 'NON_DEMOLITION'];
      if (!validTypes.includes(data.type)) {
        throw new Error(`Type d'action invalide. Types autorisés: ${validTypes.join(', ')}`);
      }
    }

    if (data.commune && data.commune !== this.actions[index].commune) {
      const coords = this.generateCommuneCoordinates(data.commune);
      data.geometry = { type: "Point", coordinates: [coords.lng, coords.lat] };
      data.officialCoordinates = coords.official;
    }

    this.actions[index] = {
      ...this.actions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    const action = this.actions[index];
    if (action.pvId) {
      const pvIndex = this.pvs.findIndex(p => p.id === action.pvId);
      if (pvIndex !== -1) {
        const typeChanged = (data.type && data.type !== this.pvs[pvIndex].type);
        this.pvs[pvIndex] = {
          ...this.pvs[pvIndex],
          action: action,
          type: data.type ? data.type : this.pvs[pvIndex].type,
          numero: typeChanged ? this.generatePVNumber(data.type) : this.pvs[pvIndex].numero,
          contenu: {
            ...this.pvs[pvIndex].contenu,
            constatations: action.observations || this.pvs[pvIndex].contenu.constatations,
            coordonnees: action.geometry ? {
              latitude: action.geometry.coordinates[1],
              longitude: action.geometry.coordinates[0],
              source: action.officialCoordinates ? 'Coordonnées officielles vérifiées' : 'Géolocalisation estimée'
            } : this.pvs[pvIndex].contenu.coordonnees
          }
        };
      }
    }

    this.notifyListeners();
    return this.actions[index];
  }

  async deleteAction(id) {
    await this.delay();
    
    const actionIndex = this.actions.findIndex((a) => a.id === id);
    if (actionIndex === -1) {
      throw new Error('Action non trouvée');
    }

    const action = this.actions[actionIndex];
    
    // Supprimer l'action
    this.actions.splice(actionIndex, 1);
    
    // Supprimer aussi le PV lié s'il existe
    if (action.pvId) {
      const pvIndex = this.pvs.findIndex(p => p.id === action.pvId);
      if (pvIndex !== -1) {
        this.pvs.splice(pvIndex, 1);
        console.log(`PV ${action.pvId} supprimé avec l'action ${id}`);
      }
    }

    this.notifyListeners();
    
    console.log(`Action ${id} supprimée`);
    return { success: true, deletedActionId: id, deletedPVId: action.pvId };
  }

  /* ======= PV AVEC GÉOLOCALISATION ======= */
  generatePVNumber(type = 'SIG') {
    const year = new Date().getFullYear();
    const short = (type || 'SIG').substring(0, 3).toUpperCase();
    const ts = Date.now().toString().slice(-6);
    return `PV${year}${short}${ts}`;
  }

  getActionTypeLabel(type) {
    const labels = {
      'DEMOLITION': 'de démolition',
      'SIGNALEMENT': 'de signalement', 
      'NON_DEMOLITION': 'de non-démolition'
    };
    return labels[type] || type;
  }

  async getPVs() { 
    await this.delay(); 
    return [...this.pvs]; 
  }

  async getPVById(id) { 
    await this.delay(); 
    return this.pvs.find((p) => p.id === id); 
  }

  async createPV(pvData) {
    await this.delay();

    // Si un PV est déjà lié à cette action, renvoyer l'existant
    if (pvData?.actionId) {
      const existing = this.pvs.find(p => p.actionId === pvData.actionId);
      if (existing) {
        return existing;
      }
    }

    // Récupérer l'action liée si disponible
    const linkedAction = pvData?.action || (pvData?.actionId ? this.actions.find(a => a.id === pvData.actionId) : null);

    const pv = {
      id: `pv_${Date.now()}`,
      numero: this.generatePVNumber(pvData.type || linkedAction?.type || 'SIGNALEMENT'),
      type: pvData.type || linkedAction?.type || 'SIGNALEMENT',
      statut: pvData.statut || 'BROUILLON',
      contenu: pvData.contenu || {
        coordonnees: linkedAction?.geometry ? {
          latitude: linkedAction.geometry.coordinates[1],
          longitude: linkedAction.geometry.coordinates[0],
          source: linkedAction.officialCoordinates ? 'Coordonnées officielles vérifiées' : 'Géolocalisation estimée'
        } : null
      },
      createdAt: new Date().toISOString(),
      createdBy: pvData.createdBy || pvData.redacteurUserId || linkedAction?.userId || null,
      redacteurUserId: pvData.redacteurUserId || linkedAction?.userId || null,
      validatedAt: null,
      validatedBy: null,
      action: linkedAction || null,
      actionId: pvData.actionId || linkedAction?.id || null,
    };

    this.pvs.push(pv);

    // Lier l'action au PV si nécessaire
    if (pv.actionId) {
      const idx = this.actions.findIndex(a => a.id === pv.actionId);
      if (idx !== -1) {
        this.actions[idx] = { ...this.actions[idx], pvId: pv.id, updatedAt: new Date().toISOString() };
        pv.action = this.actions[idx];
      }
    }

    this.notifyListeners(); 
    return pv;
  }

  async updatePV(id, data) {
    await this.delay();
    
    const index = this.pvs.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('PV non trouvé');
    }

    // Ne pas permettre la modification si déjà validé
    if (this.pvs[index].statut === 'VALIDE' && data.statut !== 'VALIDE') {
      throw new Error('Impossible de modifier un PV déjà validé');
    }

    // Si le type du PV change, régénérer le numéro
    const nextType = data.type || this.pvs[index].type;
    const numero =
      nextType !== this.pvs[index].type
        ? this.generatePVNumber(nextType)
        : this.pvs[index].numero;

    this.pvs[index] = {
      ...this.pvs[index],
      ...data,
      type: nextType,
      numero,
      updatedAt: new Date().toISOString()
    };

    // Aligner l'action liée si fournie/nécessaire
    const pv = this.pvs[index];
    if (pv.actionId) {
      const aIndex = this.actions.findIndex(a => a.id === pv.actionId);
      if (aIndex !== -1) {
        if (this.actions[aIndex].pvId !== pv.id) {
          this.actions[aIndex] = { ...this.actions[aIndex], pvId: pv.id, updatedAt: new Date().toISOString() };
        }
      }
    }

    this.notifyListeners();
    return this.pvs[index];
  }

  async validatePV(id, validatorUserId) {
    await this.delay();
    
    const index = this.pvs.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('PV non trouvé');
    }

    const pv = this.pvs[index];
    
    // Vérifications avant validation
    if (pv.statut === 'VALIDE') {
      throw new Error('PV déjà validé');
    }

    if (!pv.contenu?.constatations?.trim()) {
      throw new Error('Les constatations sont requises pour valider le PV');
    }

    if (!pv.contenu?.decisions?.trim()) {
      throw new Error('Les décisions sont requises pour valider le PV');
    }

    // Pour les démolitions, vérifier les photos
    if (pv.type === 'DEMOLITION') {
      if (!pv.contenu?.photos?.before || !pv.contenu?.photos?.after) {
        throw new Error('Les photos avant/après sont obligatoires pour les PV de démolition');
      }
    }

    // Validation
    this.pvs[index] = {
      ...pv,
      statut: 'VALIDE',
      validatedAt: new Date().toISOString(),
      validatedBy: validatorUserId,
      updatedAt: new Date().toISOString()
    };

    // Mettre à jour le statut de l'action associée
    if (pv.actionId) {
      const actionIndex = this.actions.findIndex(a => a.id === pv.actionId);
      if (actionIndex !== -1) {
        this.actions[actionIndex] = {
          ...this.actions[actionIndex],
          status: 'TERMINEE',
          updatedAt: new Date().toISOString()
        };
      }
    }

    this.notifyListeners();
    
    console.log(`✅ PV ${id} validé par ${validatorUserId} avec coordonnées officielles`);
    return this.pvs[index];
  }

  /* ======= AUTH ======= */
  async login(email, password) {
    await this.delay();
    const user = this.users.find((u) => u.email === email);
    if (user && password) {
      // Vérifier que l'utilisateur a des coordonnées cohérentes
      if (user.commune) {
        const coords = getCommuneCoordinates(user.commune);
        if (!coords) {
          console.warn(`⚠️ Commune ${user.commune} non trouvée dans les coordonnées officielles`);
        }
      }
      return { token: `mock_token_${Date.now()}`, user };
    }
    throw new Error('Identifiants invalides');
  }

  async logout() { 
    await this.delay(); 
    return true; 
  }

  /* ======= STATS & SEARCH AVEC GÉOLOCALISATION ======= */
  async getStats() {
    await this.delay();
    
    // Statistiques enrichies avec informations de coordonnées
    const statsWithCoords = {
      totalMissions: this.missions.length,
      totalChangements: this.changements.length,
      totalActions: this.actions.length,
      totalUsers: this.users.length,
      missionsEnCours: this.missions.filter((m) => m.status === 'EN_COURS').length,
      changementsDetectes: this.changements.filter((c) => c.statut === 'DETECTE').length,
      changementsEnTraitement: this.changements.filter((c) => c.statut === 'EN_TRAITEMENT').length,
      changementsTraites: this.changements.filter((c) => c.statut === 'TRAITE').length,
      
      // Statistiques de géolocalisation
      geoStats: {
        actionsAvecCoordonneesOfficielles: this.actions.filter(a => a.officialCoordinates).length,
        missionsAvecCoordonneesOfficielles: this.missions.filter(m => m.officialCoordinates).length,
        changementsAvecCoordonneesOfficielles: this.changements.filter(c => c.officialCoordinates).length,
        douarsAvecCoordonneesOfficielles: this.douars.filter(d => d.officialCoordinates).length
      },
      
      // Stats par commune avec coordonnées disponibles
      communesStats: Object.keys(ARRONDISSEMENTS_COMMUNES).reduce((acc, arr) => {
        const communes = ARRONDISSEMENTS_COMMUNES[arr];
        communes.forEach(commune => {
          const coords = getCommuneCoordinates(commune);
          acc[commune] = {
            hasOfficialCoords: !!coords,
            coordinates: coords,
            actions: this.actions.filter(a => a.commune === commune).length,
            missions: this.missions.filter(m => m.commune === commune).length,
            changements: this.changements.filter(c => c.commune === commune).length,
            douars: this.douars.filter(d => d.commune === commune).length
          };
        });
        return acc;
      }, {})
    };
    
    return statsWithCoords;
  }

  async searchMissions(filters = {}) {
    await this.delay();
    let result = [...this.missions];
    
    if (filters.status) result = result.filter((m) => m.status === filters.status);
    if (filters.commune) result = result.filter((m) => normalizeCommune(m.commune) === normalizeCommune(filters.commune));
    if (filters.prefecture) result = result.filter((m) => normalizePrefecture(m.prefecture) === normalizePrefecture(filters.prefecture));
    if (filters.hasOfficialCoords !== undefined) {
      result = result.filter(m => !!m.officialCoordinates === filters.hasOfficialCoords);
    }
    if (filters.dateDebut && filters.dateFin) {
      result = result.filter((m) => {
        const d = new Date(m.createdAt);
        return d >= new Date(filters.dateDebut) && d <= new Date(filters.dateFin);
      });
    }
    return result;
  }

  // Mise à jour du searchChangements pour respecter les permissions avec géolocalisation
  async searchChangements(filters = {}, user = null) {
    await this.delay();

    // Récupérer les changements selon le rôle
    let result = user ? await this.getChangesByUserRole(user) : [...this.changements];

    // Appliquer les filtres
    if (filters.type) result = result.filter((c) => c.type === filters.type);
    if (filters.statut) result = result.filter((c) => c.statut === filters.statut);
    if (filters.commune) result = result.filter((c) => normalizeCommune(c.commune) === normalizeCommune(filters.commune));
    if (filters.prefecture) result = result.filter((c) => normalizePrefecture(c.prefecture) === normalizePrefecture(filters.prefecture));
    if (filters.hasOfficialCoords !== undefined) {
      result = result.filter(c => !!c.officialCoordinates === filters.hasOfficialCoords);
    }
    
    if (filters.dateDebut && filters.dateFin) {
      result = result.filter((c) => {
        const d = new Date(c.dateDetection);
        return d >= new Date(filters.dateDebut) && d <= new Date(filters.dateFin);
      });
    }

    return result;
  }

  /* ======= MÉTHODES UTILITAIRES AVEC GÉOLOCALISATION ======= */
  async getActionWithPV(actionId) {
    await this.delay();
    
    const action = this.actions.find(a => a.id === actionId);
    if (!action) return null;

    const pv = action.pvId ? this.pvs.find(p => p.id === action.pvId) : null;
    
    return {
      ...action,
      pv,
      hasOfficialCoordinates: !!action.officialCoordinates
    };
  }

  async getPVWithAction(pvId) {
    await this.delay();
    
    const pv = this.pvs.find(p => p.id === pvId);
    if (!pv) return null;

    const action = pv.actionId ? this.actions.find(a => a.id === pv.actionId) : null;
    
    return {
      ...pv,
      action,
      hasOfficialCoordinates: !!(action?.officialCoordinates)
    };
  }

  async getActionsByUser(userId) {
    await this.delay();
    
    return this.actions.filter(a => 
      a.userId === userId || 
      a.user?.id === userId
    );
  }

  async getPVsByUser(userId) {
    await this.delay();
    
    return this.pvs.filter(p => 
      p.redacteurUserId === userId || 
      p.createdBy === userId
    );
  }

  async getActionsByCommune(commune) {
    await this.delay();
    
    const coords = getCommuneCoordinates(commune);
    const actions = this.actions.filter(a => a.commune === commune);
    
    return {
      actions,
      commune,
      hasOfficialCoordinates: !!coords,
      coordinates: coords,
      total: actions.length
    };
  }

  // Méthode utile pour le debugging avec informations géographiques
  async getAllData() {
    await this.delay();
    
    return {
      actions: this.actions,
      pvs: this.pvs,
      users: this.users,
      missions: this.missions,
      changements: this.changements,
      stats: {
        totalActions: this.actions.length,
        totalPVs: this.pvs.length,
        totalChangements: this.changements.length,
        pvsValides: this.pvs.filter(p => p.statut === 'VALIDE').length,
        actionsSanssPV: this.actions.filter(a => !a.pvId).length,
        itemsAvecCoordonneesOfficielles: {
          actions: this.actions.filter(a => a.officialCoordinates).length,
          missions: this.missions.filter(m => m.officialCoordinates).length,
          changements: this.changements.filter(c => c.officialCoordinates).length,
          douars: this.douars.filter(d => d.officialCoordinates).length
        }
      },
      geoValidation: {
        totalCommunesReconnues: Object.keys(ARRONDISSEMENTS_COMMUNES).reduce((acc, arr) => acc + ARRONDISSEMENTS_COMMUNES[arr].length, 0),
        communesSansCoordonnees: Object.keys(ARRONDISSEMENTS_COMMUNES).reduce((acc, arr) => {
          ARRONDISSEMENTS_COMMUNES[arr].forEach(commune => {
            if (!getCommuneCoordinates(commune)) {
              acc.push(commune);
            }
          });
          return acc;
        }, [])
      }
    };
  }
}

// Instance singleton avec validation géographique
const mockApiService = new MockApiService();

/* Hook React pour réactivité avec coordonnées officielles - VERSION CORRIGÉE */
export function useMock(user = null) {
  const [users, setUsers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [changements, setChangements] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const updateData = useCallback(async () => {
    try {
      const [u, m, a] = await Promise.all([
        mockApiService.getUsers(),
        mockApiService.getMissions(),
        mockApiService.getActions(),
      ]);

      // Récupérer les changements selon le rôle de l'utilisateur
      const c = user 
        ? await mockApiService.getChangesByUserRole(user)
        : await mockApiService.getChangements();

      setUsers(u); 
      setMissions(m); 
      setChangements(c); 
      setActions(a);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    updateData();
    const unsubscribe = mockApiService.subscribe(updateData);
    return unsubscribe;
  }, [updateData]);

  return { 
    users, 
    missions, 
    changements, 
    actions, 
    loading, 
    refetch: updateData,
    hasOfficialCoordinates: true // Indique que ce hook utilise les coordonnées officielles
  };
}

// Hook spécialisé pour les changements avec filtrage avancé et géolocalisation
export function useChangementsFiltered(user, filters = {}) {
  const [changements, setChangements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const updateChangements = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer changements et stats selon le rôle
      const [changementsData, statsData] = await Promise.all([
        mockApiService.searchChangements(filters, user),
        mockApiService.getChangementsStatsByUser(user)
      ]);
      
      setChangements(changementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur changements:', error);
      setChangements([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    updateChangements();
    const unsubscribe = mockApiService.subscribe(updateChangements);
    return unsubscribe;
  }, [updateChangements]);

  return {
    changements,
    stats,
    loading,
    refetch: updateChangements,
    hasOfficialCoordinates: true
  };
}

export default mockApiService;