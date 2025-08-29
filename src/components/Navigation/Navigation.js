import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navigation.module.css';

function Navigation({ onNavigate }) {
  const { user, canAccessUsers, isReadOnly } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard',     label: 'Tableau de bord',   icon: 'home',           roles: ['all'] },
    { path: '/carte',         label: 'Carte interactive', icon: 'map',            roles: ['all'] },
    { path: '/missions',      label: 'Missions',          icon: 'target',         roles: ['all'] },
    { path: '/actions',       label: 'Actions',           icon: 'activity',       roles: ['all'] },
    { path: '/changements',   label: 'Changements',       icon: 'alert-triangle', roles: ['all'] },
    { path: '/utilisateurs',  label: 'Utilisateurs',      icon: 'users',          roles: ['MEMBRE_DSI'] },
    { path: '/statistiques',  label: 'Statistiques',      icon: 'bar-chart',      roles: ['GOUVERNEUR', 'MEMBRE_DSI'] },
  ];

  const handleItemClick = () => onNavigate && onNavigate();

  const handleActionClick = (actionPath) => {
    navigate(actionPath);
    onNavigate && onNavigate();
  };

  const getIconComponent = (iconName) => {
    const textIconMap = {
      home: 'TB',
      map: 'MAP',
      target: 'MSN',
      activity: 'ACT',
      'alert-triangle': 'CHG',
      users: 'USR',
      'bar-chart': 'STAT',
    };
    return (
      <span className={styles.iconText}>
        {textIconMap[iconName] || iconName.toUpperCase().slice(0, 3)}
      </span>
    );
  };

  const canCreateMissions = () =>
    user && (user.role === 'GOUVERNEUR' || user.role === 'MEMBRE_DSI');

  const canCreateActions = () =>
    user && (user.role === 'AGENT_AUTORITE' || user.role === 'MEMBRE_DSI');

  const canDeclareChangements = () =>
    user && user.role === 'MEMBRE_DSI';

  const canViewStats = () =>
    user && (user.role === 'GOUVERNEUR' || user.role === 'MEMBRE_DSI');

  return (
    <nav className={styles.navigation}>
      <ul className={styles.menuList}>
        {menuItems.map((item) => {
          if (item.roles.includes('MEMBRE_DSI') && !canAccessUsers()) return null;
          if (item.path === '/statistiques' && !canViewStats()) return null;

          return (
            <li key={item.path} className={styles.menuItem}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.menuLink} ${isActive ? styles.menuLinkActive : ''}`
                }
                onClick={handleItemClick}
              >
                <span className={styles.menuIcon}>{getIconComponent(item.icon)}</span>
                <span className={styles.menuLabel}>{item.label}</span>
                {isReadOnly() && item.path !== '/dashboard' && item.path !== '/changements' && (
                  <span className={styles.readOnlyBadge}>READ</span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Actions rapides */}
      <div className={styles.secondaryMenu}>
        <div className={styles.sectionTitle}>Actions rapides</div>
        <ul className={styles.menuList}>
          {canDeclareChangements() && !isReadOnly() && (
            <li className={styles.menuItem}>
              <button
                className={styles.actionButton}
                onClick={() => handleActionClick('/changements/nouveau')}
              >
                <span className={styles.menuIcon}><span className={styles.iconText}>📸</span></span>
                <span className={styles.menuLabel}>Déclarer changement</span>
              </button>
            </li>
          )}

          {canCreateMissions() && !isReadOnly() && (
            <li className={styles.menuItem}>
              <button
                className={styles.actionButton}
                onClick={() => handleActionClick('/missions/nouveau')}
              >
                <span className={styles.menuIcon}><span className={styles.iconText}>🎯</span></span>
                <span className={styles.menuLabel}>Nouvelle mission</span>
              </button>
            </li>
          )}

          {canCreateActions() && !isReadOnly() && (
            <li className={styles.menuItem}>
              <button
                className={styles.actionButton}
                onClick={() => handleActionClick('/actions/nouveau')}
              >
                <span className={styles.menuIcon}><span className={styles.iconText}>⚡</span></span>
                <span className={styles.menuLabel}>Nouvelle action</span>
              </button>
            </li>
          )}

          <li className={styles.menuItem}>
            <button
              className={styles.actionButton}
              onClick={() => handleActionClick('/surveillance')}
            >
              <span className={styles.menuIcon}><span className={styles.iconText}>👁️</span></span>
              <span className={styles.menuLabel}>Surveillance habitats</span>
            </button>
          </li>

          {canViewStats() && (
            <li className={styles.menuItem}>
              <button
                className={styles.actionButton}
                onClick={() => handleActionClick('/statistiques')}
              >
                <span className={styles.menuIcon}><span className={styles.iconText}>📊</span></span>
                <span className={styles.menuLabel}>Statistiques</span>
              </button>
            </li>
          )}

          <li className={styles.menuItem}>
            <button
              className={styles.actionButton}
              onClick={() => handleActionClick('/rapports')}
            >
              <span className={styles.menuIcon}><span className={styles.iconText}>📋</span></span>
              <span className={styles.menuLabel}>Rapports</span>
            </button>
          </li>
        </ul>
      </div>

      <div className={styles.userInfo}>
        <div className={styles.userDetails}>
          <span className={styles.userName}>{user?.fullName || user?.nom || 'Utilisateur'}</span>
          <span className={styles.userRole}>
            {user?.role === 'GOUVERNEUR' && 'Gouverneur'}
            {user?.role === 'MEMBRE_DSI' && 'Membre DSI'}
            {user?.role === 'AGENT_AUTORITE' && "Agent d'Autorité"}
          </span>
          <span className={styles.userLocation}>
            {user?.commune && user?.prefecture ? `${user.commune}, ${user.prefecture}` : ''}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
