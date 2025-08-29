import React, { createContext, useContext, useState, useEffect } from 'react';
import { notification } from 'antd';
import mockApiService from '../services/mockApi';
import { storage } from '../utils';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const USER_ROLES = {
  AGENT_AUTORITE: 'AGENT_AUTORITE',
  MEMBRE_DSI: 'MEMBRE_DSI',
  GOUVERNEUR: 'GOUVERNEUR'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = storage.get('auth_token');
        const savedUser = storage.get('auth_user');
        
        if (token && savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        storage.remove('auth_token');
        storage.remove('auth_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await mockApiService.login(email, password);
      
      if (response.token && response.user) {
        storage.set('auth_token', response.token);
        storage.set('auth_user', response.user);
        
        setUser(response.user);
        setIsAuthenticated(true);
        
        notification.success({
          message: 'Connexion réussie',
          description: `Bienvenue ${response.user.fullName || response.user.nom}!`
        });
        
        return { success: true, user: response.user };
      }
      
      throw new Error('Réponse d\'authentification invalide');
    } catch (error) {
      notification.error({
        message: 'Erreur de connexion',
        description: error.message || 'Identifiants invalides'
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await mockApiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      storage.remove('auth_token');
      storage.remove('auth_user');
      
      setUser(null);
      setIsAuthenticated(false);
      
      notification.info({
        message: 'Déconnexion',
        description: 'Vous avez été déconnecté avec succès'
      });
    }
  };

  // Vérifier les permissions utilisateur (sans référence aux amendes)
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      canCreateMissions: [USER_ROLES.MEMBRE_DSI].includes(user.role),
      canCreateChangements: user.role === 'MEMBRE_DSI',
      canDeleteMissions: [USER_ROLES.MEMBRE_DSI].includes(user.role),
      canViewMissions: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI, USER_ROLES.AGENT_AUTORITE].includes(user.role),
      
      canCreateActions: [USER_ROLES.AGENT_AUTORITE, USER_ROLES.MEMBRE_DSI].includes(user.role),
      canUpdateActions: [USER_ROLES.AGENT_AUTORITE, USER_ROLES.MEMBRE_DSI].includes(user.role),
      canViewActions: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI, USER_ROLES.AGENT_AUTORITE].includes(user.role),
      
      canDeclareChangements: [USER_ROLES.MEMBRE_DSI].includes(user.role),
      canViewChangements: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI, USER_ROLES.AGENT_AUTORITE].includes(user.role),
      
      canManageUsers: [USER_ROLES.MEMBRE_DSI].includes(user.role),
      canAccessUsers: [USER_ROLES.MEMBRE_DSI].includes(user.role),
      
      canViewStats: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI].includes(user.role),
      canExportData: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI].includes(user.role),
      
      canViewAll: [USER_ROLES.GOUVERNEUR, USER_ROLES.MEMBRE_DSI].includes(user.role),
      canViewOwn: [USER_ROLES.AGENT_AUTORITE].includes(user.role)
    };
    
    return permissions[permission] || false;
  };

  // Fonctions spécifiques aux rôles
  const isAgent = () => user?.role === USER_ROLES.AGENT_AUTORITE;
  const isDSI = () => user?.role === USER_ROLES.MEMBRE_DSI;
  const isGouverneur = () => user?.role === USER_ROLES.GOUVERNEUR;

  const canAccessUsers = () => hasPermission('canAccessUsers');
  
  const isReadOnly = (resource = null) => {
    if (isGouverneur() || isDSI()) return false;
    
    if (isAgent()) {
      if (resource) {
        const isSameCommune = resource.commune === user.commune;
        const isOwnResource = resource.userId === user.id || resource.agentId === user.id;
        return !(isSameCommune || isOwnResource);
      }
      return false;
    }
    
    return true;
  };

  const getRoleDisplayName = () => {
    const roleNames = {
      [USER_ROLES.AGENT_AUTORITE]: "Agent d'Autorité",
      [USER_ROLES.MEMBRE_DSI]: "Membre DSI",
      [USER_ROLES.GOUVERNEUR]: "Gouverneur"
    };
    return roleNames[user?.role] || user?.role;
  };

  const getUserLocation = () => {
    return {
      commune: user?.commune || null,
      prefecture: user?.prefecture || null
    };
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    storage.set('auth_user', updatedUser);
  };

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    
    login,
    logout,
    updateUser,
    
    hasPermission,
    isAgent,
    isDSI,
    isGouverneur,
    getRoleDisplayName,
    getUserLocation,
    
    canAccessUsers,
    isReadOnly,
    
    ROLES: USER_ROLES,
    
    PERMISSIONS: {
      CAN_VIEW_ALL: 'canViewAll',
      CAN_VIEW_OWN: 'canViewOwn',
      CAN_VIEW_STATS: 'canViewStats',
      CAN_MANAGE_USERS: 'canManageUsers',
      CAN_CREATE_MISSIONS: 'canCreateMissions',
      CAN_DELETE_MISSIONS: 'canDeleteMissions',
      CAN_CREATE_ACTIONS: 'canCreateActions',
      CAN_UPDATE_ACTIONS: 'canUpdateActions',
      CAN_DECLARE_CHANGEMENTS: 'canDeclareChangements',
      CAN_VIEW_CHANGEMENTS: 'canViewChangements',
      CAN_EXPORT_DATA: 'canExportData'
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};