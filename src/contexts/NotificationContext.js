import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { notification as antdNotification } from 'antd';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NOTIFICATION_TYPES = {
  MISSION_ASSIGNED: 'MISSION_ASSIGNED',           
  ACTION_COMPLETED: 'ACTION_COMPLETED',             
  PV_GENERATED: 'PV_GENERATED',                   
  CHANGEMENT_DECLARED: 'CHANGEMENT_DECLARED',     
  MISSION_CREATED: 'MISSION_CREATED',             
  SYSTEM_UPDATE: 'SYSTEM_UPDATE'                  
};


const ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_LOADING: 'SET_LOADING'
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        loading: false
      };

    case ACTIONS.ADD_NOTIFICATION:
      const newNotification = action.payload;
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case ACTIONS.DELETE_NOTIFICATION:
      const filteredNotifs = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filteredNotifs,
        unreadCount: filteredNotifs.filter(n => !n.isRead).length
      };

    case ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();

  

  const loadNotifications = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const mockNotifications = generateUserNotifications(user);
      
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: mockNotifications });
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: [] });
    }
  };



  const addNotification = (notification) => {
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
    
    const config = getNotificationConfig(notification);
    antdNotification.open(config);
  };

  const markAsRead = (notificationId) => {
    dispatch({ type: ACTIONS.MARK_AS_READ, payload: notificationId });
  };

  const deleteNotification = (notificationId) => {
    dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: notificationId });
  };

  const markAllAsRead = () => {
    dispatch({ type: ACTIONS.MARK_ALL_AS_READ });
  };

  const sendNotification = async (type, data) => {
    const recipients = getNotificationRecipients(type, data);
    
    recipients.forEach(recipientId => {
      const notification = {
        id: `notif_${Date.now()}_${recipientId}`,
        type,
        title: getNotificationTitle(type, data),
        message: getNotificationMessage(type, data),
        senderId: user.id,
        senderName: user.fullName || user.nom,
        recipientId,
        data,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      console.log('Notification envoyée:', notification);
      
      if (recipientId === user.id) {
        addNotification(notification);
      }
    });
  };

  const notifyMissionAssigned = (missionData) => {
    if (!missionData.agentId) return;
    
    sendNotification(NOTIFICATION_TYPES.MISSION_ASSIGNED, {
      missionId: missionData.id,
      missionTitle: missionData.titre,
      agentId: missionData.agentId,
      sector: missionData.commune
    });
  };

  const notifyActionCompleted = (actionData) => {
    sendNotification(NOTIFICATION_TYPES.ACTION_COMPLETED, {
      actionId: actionData.id,
      actionType: actionData.type,
      agentId: user.id,
      commune: actionData.commune
    });
  };

  const notifyPVGenerated = (pvData) => {
    sendNotification(NOTIFICATION_TYPES.PV_GENERATED, {
      pvId: pvData.id,
      actionType: pvData.type,
      actionId: pvData.actionId
    });
  };

  const notifyChangementDeclared = (changementData) => {
    sendNotification(NOTIFICATION_TYPES.CHANGEMENT_DECLARED, {
      changementId: changementData.id,
      commune: changementData.commune,
      type: changementData.type
    });
  };

  const notifyMissionCreated = (missionData) => {
    sendNotification(NOTIFICATION_TYPES.MISSION_CREATED, {
      missionId: missionData.id,
      commune: missionData.commune,
      createdBy: user.id
    });
  };

  return (
    <NotificationContext.Provider value={{
      ...state,
      addNotification,
      markAsRead,
      deleteNotification,
      markAllAsRead,
      sendNotification,
      loadNotifications,
      notifyMissionAssigned,
      notifyActionCompleted,
      notifyPVGenerated,
      notifyChangementDeclared,
      notifyMissionCreated
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};

const generateUserNotifications = (user) => {
  const notifications = [];
  const now = new Date();

  if (user.role === 'AGENT_AUTORITE') {
    notifications.push({
      id: 'notif_mission_1',
      type: NOTIFICATION_TYPES.MISSION_ASSIGNED,
      title: 'Mission assignée',
      message: 'Nouvelle mission de surveillance assignée dans votre secteur.',
      senderId: 'dsi_user',
      senderName: 'Service DSI',
      recipientId: user.id,
      data: { missionId: 'mission_1', sector: user.commune },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false
    });
  } else if (user.role === 'MEMBRE_DSI') {
    notifications.push({
      id: 'notif_action_1',
      type: NOTIFICATION_TYPES.ACTION_COMPLETED,
      title: 'Action terrain complétée',
      message: 'Une action de démolition a été complétée par l\'agent terrain.',
      senderId: 'agent_user',
      senderName: 'Agent Anfa',
      recipientId: user.id,
      data: { actionId: 'action_1', actionType: 'DEMOLITION' },
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      isRead: false
    });
  } else if (user.role === 'GOUVERNEUR') {
    notifications.push({
      id: 'notif_pv_1',
      type: NOTIFICATION_TYPES.PV_GENERATED,
      title: 'Nouveau PV généré',
      message: 'Un procès-verbal a été généré automatiquement suite à une action terrain.',
      senderId: 'system',
      senderName: 'Système HNR',
      recipientId: user.id,
      data: { pvId: 'pv_1', actionType: 'SIGNALEMENT' },
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      isRead: true
    });
  }

  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Génération notification aléatoire selon contexte
const generateRandomNotification = (user) => {
  const types = Object.values(NOTIFICATION_TYPES);
  const allowedTypes = types.filter(type => {
    if (user.role === 'AGENT_AUTORITE') {
      return ['MISSION_ASSIGNED', 'SYSTEM_UPDATE'].includes(type);
    } else if (user.role === 'MEMBRE_DSI') {
      return ['ACTION_COMPLETED', 'PV_GENERATED', 'SYSTEM_UPDATE'].includes(type);
    } else if (user.role === 'GOUVERNEUR') {
      return ['CHANGEMENT_DECLARED', 'MISSION_CREATED', 'PV_GENERATED', 'SYSTEM_UPDATE'].includes(type);
    }
    return false;
  });

  if (allowedTypes.length === 0) return null;

  const randomType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    type: randomType,
    title: getNotificationTitle(randomType),
    message: getNotificationMessage(randomType),
    senderId: 'system',
    senderName: 'Système HNR',
    recipientId: user.id,
    data: { generated: true },
    createdAt: new Date().toISOString(),
    isRead: false
  };
};

const getNotificationRecipients = (type, data) => {
  switch (type) {
    case NOTIFICATION_TYPES.MISSION_ASSIGNED:
      return [data.agentId];
    case NOTIFICATION_TYPES.ACTION_COMPLETED:
    case NOTIFICATION_TYPES.PV_GENERATED:
      return ['dsi_user', 'gouverneur_user'];
    case NOTIFICATION_TYPES.CHANGEMENT_DECLARED:
    case NOTIFICATION_TYPES.MISSION_CREATED:
      return ['gouverneur_user'];
    case NOTIFICATION_TYPES.SYSTEM_UPDATE:
      return ['all_users'];
    default:
      return [];
  }
};

const getNotificationTitle = (type, data = {}) => {
  switch (type) {
    case NOTIFICATION_TYPES.MISSION_ASSIGNED:
      return 'Mission assignée';
    case NOTIFICATION_TYPES.ACTION_COMPLETED:
      return 'Action terrain complétée';
    case NOTIFICATION_TYPES.PV_GENERATED:
      return 'PV généré automatiquement';
    case NOTIFICATION_TYPES.CHANGEMENT_DECLARED:
      return 'Nouveau changement déclaré';
    case NOTIFICATION_TYPES.MISSION_CREATED:
      return 'Nouvelle mission créée';
    case NOTIFICATION_TYPES.SYSTEM_UPDATE:
      return 'Mise à jour système';
    default:
      return 'Notification';
  }
};

const getNotificationMessage = (type, data = {}) => {
  switch (type) {
    case NOTIFICATION_TYPES.MISSION_ASSIGNED:
      return `Mission "${data.missionTitle || 'de surveillance'}" assignée dans ${data.sector || 'votre secteur'}.`;
    case NOTIFICATION_TYPES.ACTION_COMPLETED:
      return `Action de type "${data.actionType || 'intervention'}" complétée sur le terrain.`;
    case NOTIFICATION_TYPES.PV_GENERATED:
      return `PV généré automatiquement suite à une action "${data.actionType || 'terrain'}".`;
    case NOTIFICATION_TYPES.CHANGEMENT_DECLARED:
      return `Changement déclaré dans ${data.commune || 'une commune'} nécessitant suivi.`;
    case NOTIFICATION_TYPES.MISSION_CREATED:
      return `Nouvelle mission créée pour ${data.commune || 'surveillance'}.`;
    case NOTIFICATION_TYPES.SYSTEM_UPDATE:
      return 'Mise à jour du système HNR Monitor disponible.';
    default:
      return data.message || 'Nouvelle notification disponible.';
  }
};

const getNotificationConfig = (notification) => {
  const baseConfig = {
    message: notification.title,
    description: notification.message,
    placement: 'topRight',
    duration: 4
  };

  switch (notification.type) {
    case NOTIFICATION_TYPES.MISSION_ASSIGNED:
      return { ...baseConfig, type: 'info' };
    case NOTIFICATION_TYPES.ACTION_COMPLETED:
      return { ...baseConfig, type: 'success' };
    case NOTIFICATION_TYPES.PV_GENERATED:
      return { ...baseConfig, type: 'success' };
    case NOTIFICATION_TYPES.CHANGEMENT_DECLARED:
      return { ...baseConfig, type: 'warning' };
    case NOTIFICATION_TYPES.MISSION_CREATED:
      return { ...baseConfig, type: 'info' };
    case NOTIFICATION_TYPES.SYSTEM_UPDATE:
      return { ...baseConfig, type: 'info', duration: 6 };
    default:
      return { ...baseConfig, type: 'info' };
  }
};