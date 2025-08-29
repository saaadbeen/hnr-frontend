import React, { useState, useEffect } from 'react';
import mockApiService from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CartePanel.module.css';

function CartePanel({ item, onClose, className = '' }) {
  const { canCreateAction, isReadOnly } = useAuth();
  const [agent, setAgent] = useState(null);
  const [relatedActions, setRelatedActions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return;

    const loadAdditionalData = async () => {
      setLoading(true);
      try {
        if (item.type === 'mission' && item.agentId) {
          const agentData = await mockApiService.getUserById(item.agentId);
          setAgent(agentData);
        }

        const actions = await mockApiService.getActionsFiltered({
          cibleType: item.type === 'mission' ? 'MISSION' : 'DOUAR',
          cibleId: item.id
        });
        setRelatedActions(actions);
      } catch (error) {
        console.error('Erreur chargement données panel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdditionalData();
  }, [item]);

  if (!item) return null;

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

  const getActionTypeLabel = (type) => {
    const labels = {
      'DEMOLITION': 'Démolition',
      'SIGNALEMENT': 'Signalement',
      'AMENDE': 'Amende',
      'REGULARISATION': 'Régularisation',
      'MISE_EN_DEMEURE': 'Mise en demeure',
      'NON_DEMOLITION': 'Non-démolition'
    };
    return labels[type] || type;
  };

  return (
    <div className={`${styles.panel} ${className}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.panelTitle}>
            {item.dataType === 'mission' ? '[Mission] ' : '[Changement] '}
            {item.titre || item.nom || `Changement ${item.type}`}
          </h3>
          <div 
            className={styles.statut}
            style={{ 
              backgroundColor: getStatutColor(item.status || item.statut),
              color: 'white'
            }}
          >
            {getStatutLabel(item.status || item.statut)}
          </div>
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Contenu */}
      <div className={styles.panelContent}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        ) : (
          <>
            {/* Informations générales */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Informations générales</h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Zone :</span>
                  <span className={styles.infoValue}>
                    {item.commune}, {item.prefecture}
                  </span>
                </div>
                
                {/* Coordonnées géographiques */}
                {(item.latitude && item.longitude) && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Coordonnées :</span>
                    <span className={styles.infoValue}>
                      {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                    </span>
                  </div>
                )}
                
                {item.dataType === 'mission' ? (
                  <>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Créée le :</span>
                      <span className={styles.infoValue}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.dateDebut && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Période :</span>
                        <span className={styles.infoValue}>
                          Du {formatDate(item.dateDebut)} au {formatDate(item.dateFin)}
                        </span>
                      </div>
                    )}
                    {item.assignedUsers && item.assignedUsers.length > 0 && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Agents assignés :</span>
                        <span className={styles.infoValue}>
                          {item.assignedUsers.join(', ')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.surface && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Surface :</span>
                        <span className={styles.infoValue}>
                          {item.surface} m²
                        </span>
                      </div>
                    )}
                    {item.dateDetection && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Détecté le :</span>
                        <span className={styles.infoValue}>
                          {formatDate(item.dateDetection)}
                        </span>
                      </div>
                    )}
                    {item.detectedByUserId && (
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Détecté par :</span>
                        <span className={styles.infoValue}>
                          Agent {item.detectedByUserId}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {(item.description || item.observations) && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Description</h4>
                <p className={styles.description}>
                  {item.description || item.observations}
                </p>
              </div>
            )}

            {/* Photos (pour les changements) */}
            {item.dataType === 'changement' && (item.photoBefore || item.photoAfter) && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Photos</h4>
                <div className={styles.photosGrid}>
                  {item.photoBefore && (
                    <div className={styles.photoItem}>
                      <span className={styles.photoLabel}>Avant</span>
                      <img 
                        src={item.photoBefore} 
                        alt="Photo avant" 
                        className={styles.photo}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {item.photoAfter && (
                    <div className={styles.photoItem}>
                      <span className={styles.photoLabel}>Après</span>
                      <img 
                        src={item.photoAfter} 
                        alt="Photo après" 
                        className={styles.photo}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions liées */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                Actions ({relatedActions.length})
              </h4>
              {relatedActions.length > 0 ? (
                <div className={styles.actionsList}>
                  {relatedActions.map(action => (
                    <div key={action.id} className={styles.actionItem}>
                      <div className={styles.actionHeader}>
                        <span className={styles.actionType}>
                          {getActionTypeLabel(action.type)}
                        </span>
                        <span className={styles.actionDate}>
                          {formatDate(action.date)}
                        </span>
                      </div>
                      <p className={styles.actionDescription}>
                        {action.observations || action.description}
                      </p>
                      {action.montantAmende && (
                        <div className={styles.actionAmende}>
                          Amende: {action.montantAmende.toLocaleString()} DH
                        </div>
                      )}
                      {action.pv && (
                        <div className={styles.pvStatus}>
                          PV : {action.pv.statut === 'PUBLIE' ? 'Publié' : 'Brouillon'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noActions}>Aucune action enregistrée</p>
              )}
            </div>

            {/* Actions utilisateur */}
            {!isReadOnly() && (
              <div className={styles.actions}>
                {canCreateAction() && (
                  <button className={styles.actionButton}>
                    Nouvelle action
                  </button>
                )}
                <button className={styles.secondaryButton}>
                  Voir historique
                </button>
                {item.dataType === 'mission' && (
                  <button className={styles.secondaryButton}>
                    Générer rapport
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CartePanel;