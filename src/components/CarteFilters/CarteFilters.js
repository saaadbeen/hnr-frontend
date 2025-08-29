import React, { useState, useEffect } from 'react';
import mockApiService from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CarteFilters.module.css';

function CarteFilters({ filters, onFiltersChange }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [communes, setCommunes] = useState([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [usersData] = await Promise.all([
          mockApiService.getUsers()
        ]);
        
        setUsers(usersData.filter(u => u.role === 'AGENT_AUTORITE'));
        setCommunes(mockApiService.getUniqueCommunes());
      } catch (error) {
        console.error('Erreur chargement données filtres:', error);
      }
    };

    loadFilterData();
  }, []);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      statut: '',
      commune: '',
      agentId: '',
      type: 'all'
    });
  };

  const hasActiveFilters = filters.statut || filters.commune || filters.agentId || filters.type !== 'all';

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersRow}>
        {/* Filtre type */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type :</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Missions + Douars</option>
            <option value="missions">Missions seulement</option>
            <option value="douars">Douars seulement</option>
          </select>
        </div>

        {/* Filtre statut */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Statut :</label>
          <select
            value={filters.statut}
            onChange={(e) => handleFilterChange('statut', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tous statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="PLANIFIEE">Planifiée</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ERADIQUE">Éradiqué</option>
            <option value="DETECTE">Détecté</option>
            <option value="EN_TRAITEMENT">En traitement</option>
            <option value="TRAITE">Traité</option>
          </select>
        </div>

        {/* Filtre commune */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Commune :</label>
          <select
            value={filters.commune}
            onChange={(e) => handleFilterChange('commune', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Toutes communes</option>
            {communes.map(commune => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre agent */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Agent :</label>
          <select
            value={filters.agentId}
            onChange={(e) => handleFilterChange('agentId', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">Tous agents</option>
            {users.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.nom} ({agent.commune})
              </option>
            ))}
          </select>
        </div>

        {/* Bouton reset */}
        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <button
              onClick={resetFilters}
              className={styles.resetButton}
              title="Réinitialiser les filtres"
            >
              ✕ Reset
            </button>
          </div>
        )}
      </div>

      {/* Indicateur filtres actifs */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Filtres actifs :</span>
          {filters.type !== 'all' && (
            <span className={styles.activeFilter}>
              Type: {filters.type}
            </span>
          )}
          {filters.statut && (
            <span className={styles.activeFilter}>
              Statut: {filters.statut}
            </span>
          )}
          {filters.commune && (
            <span className={styles.activeFilter}>
              Commune: {filters.commune}
            </span>
          )}
          {filters.agentId && (
            <span className={styles.activeFilter}>
              Agent: {users.find(u => u.id === parseInt(filters.agentId))?.nom}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CarteFilters;