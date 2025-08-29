import React, { useState } from 'react';
import styles from './CarteListe.module.css';

function CarteListe({ missions, douars, onItemSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('missions');

  const getStatutColor = (statut) => {
    const colors = {
      'EN_COURS': '#f59e0b',
      'PLANIFIEE': '#3b82f6',
      'TERMINEE': '#10b981',
      'ERADIQUE': '#10b981',
      'DETECTE': '#dc2626',
      'EN_TRAITEMENT': '#ea580c',
      'TRAITE': '#10b981'
    };
    return colors[statut] || '#6b7280';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'EN_COURS': 'En cours',
      'PLANIFIEE': 'Planifiée', 
      'TERMINEE': 'Terminée',
      'ERADIQUE': 'Éradiqué',
      'DETECTE': 'Détecté',
      'EN_TRAITEMENT': 'En traitement',
      'TRAITE': 'Traité'
    };
    return labels[statut] || statut;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.liste}>
        {/* Header */}
        <div className={styles.listeHeader}>
          <h3 className={styles.listeTitle}>Liste des éléments</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'missions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('missions')}
          >
            Missions ({missions.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'douars' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('douars')}
          >
            Douars ({douars.length})
          </button>
        </div>

        {/* Content */}
        <div className={styles.listeContent}>
          {activeTab === 'missions' ? (
            <div className={styles.itemsList}>
              {missions.length > 0 ? (
                missions.map(mission => (
                  <div
                    key={mission.id}
                    className={styles.listItem}
                    onClick={() => onItemSelect(mission, 'mission')}
                  >
                    <div className={styles.itemHeader}>
                      <h4 className={styles.itemTitle}>
                        {mission.titre}
                      </h4>
                      <div
                        className={styles.itemStatut}
                        style={{
                          backgroundColor: getStatutColor(mission.status),
                          color: 'white'
                        }}
                      >
                        {getStatutLabel(mission.status)}
                      </div>
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemLocation}>
                        {mission.commune}, {mission.prefecture}
                      </div>
                      <div className={styles.itemDate}>
                        Créée le {formatDate(mission.createdAt)}
                      </div>
                      {mission.description && (
                        <div className={styles.itemDescription}>
                          {mission.description.slice(0, 80)}
                          {mission.description.length > 80 && '...'}
                        </div>
                      )}
                      {mission.assignedUsers && mission.assignedUsers.length > 0 && (
                        <div className={styles.itemAssigned}>
                          Assigné à: {mission.assignedUsers.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>Aucune mission trouvée</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.itemsList}>
              {douars.length > 0 ? (
                douars.map(douar => (
                  <div
                    key={douar.id}
                    className={styles.listItem}
                    onClick={() => onItemSelect(douar, 'douar')}
                  >
                    <div className={styles.itemHeader}>
                      <h4 className={styles.itemTitle}>
                        {douar.nom}
                      </h4>
                      <div
                        className={styles.itemStatut}
                        style={{
                          backgroundColor: getStatutColor(douar.statut),
                          color: 'white'
                        }}
                      >
                        {getStatutLabel(douar.statut)}
                      </div>
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemLocation}>
                        {douar.commune}, {douar.prefecture}
                      </div>
                      <div className={styles.itemCoords}>
                        Coordonnées: {douar.latitude}, {douar.longitude}
                      </div>
                      {douar.missionId && (
                        <div className={styles.itemMission}>
                          Mission liée: {douar.missionId}
                        </div>
                      )}
                      <div className={styles.itemDate}>
                        Créé le {formatDate(douar.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>Aucun douar trouvé</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CarteListe;