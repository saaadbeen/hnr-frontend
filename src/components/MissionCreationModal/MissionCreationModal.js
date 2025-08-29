import React, { useState, useEffect } from 'react';
import mockApiService from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';
import styles from './MissionCreationModal.module.css';

function MissionCreationModal({ 
  isOpen, 
  onClose, 
  onMissionCreated,
  initialGeometry = null,
  onGeometryEdit = null 
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prefecture: '',
    commune: '',
    agentId: '',
    geometry: initialGeometry
  });

  const prefectures = ['Casablanca', 'Mohammedia'];
  const communesParPrefecture = {
    'Casablanca': ['Anfa', 'Maarif', 'Sidi Bernoussi', 'Hay Mohammadi', 'Ain Sebaa'],
    'Mohammedia': ['Mohammedia Centre', 'Ben Yakhlef']
  };

  useEffect(() => {
    const loadAgents = async () => {
      if (formData.commune) {
        try {
          const allUsers = await mockApiService.getUsers();
          const availableAgents = allUsers.filter(u => 
            u.role === 'AGENT_AUTORITE' && 
            u.commune === formData.commune &&
            u.statut === 'ACTIF'
          );
          setAgents(availableAgents);
        } catch (err) {
          console.error('Erreur chargement agents:', err);
        }
      } else {
        setAgents([]);
      }
    };

    loadAgents();
  }, [formData.commune]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        titre: '',
        description: '',
        prefecture: '',
        commune: '',
        agentId: '',
        geometry: initialGeometry
      });
      setStep(initialGeometry ? 2 : 1); 
      setError('');
    }
  }, [isOpen, initialGeometry]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'prefecture') {
      setFormData(prev => ({
        ...prev,
        commune: '',
        agentId: ''
      }));
    }

    if (field === 'commune') {
      setFormData(prev => ({
        ...prev,
        agentId: ''
      }));
    }
  };

  const handleGeometryCreated = (geometry) => {
    setFormData(prev => ({
      ...prev,
      geometry
    }));
    setStep(2);
  };

  const validateForm = () => {
    if (!formData.titre.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }
    if (!formData.prefecture) {
      setError('La préfecture est obligatoire');
      return false;
    }
    if (!formData.commune) {
      setError('La commune est obligatoire');
      return false;
    }
    if (!formData.geometry) {
      setError('La géométrie de la mission est obligatoire');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Créer la nouvelle mission
      const newMission = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        statut: 'EN_COURS',
        prefecture: formData.prefecture,
        commune: formData.commune,
        agentId: formData.agentId ? parseInt(formData.agentId) : null,
        geometry: formData.geometry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const savedMission = await mockApiService.createMission(newMission);
      
      onMissionCreated(savedMission);
      
      onClose();
      
    } catch (err) {
      console.error('Erreur création mission:', err);
      setError('Erreur lors de la création de la mission');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const getGeometryTypeLabel = () => {
    if (!formData.geometry) return '';
    return formData.geometry.type === 'Point' ? 'Point' : 'Zone polygonale';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            ➕ Nouvelle mission
          </h2>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className={styles.modalContent}>
          {step === 1 ? (
            /* Étape 1: Instructions pour dessiner */
            <div className={styles.instructionsStep}>
              <div className={styles.instructions}>
                <h3>🗺️ Définir la zone de la mission</h3>
                <p>
                  Utilisez les outils de dessin sur la carte pour définir l'emplacement de la mission :
                </p>
                <ul>
                  <li><strong> Point :</strong> Cliquez sur la carte pour placer un marqueur</li>
                </ul>
                <div className={styles.note}>
                  💡 <strong>Astuce :</strong> Les outils de dessin sont disponibles en haut à gauche de la carte
                </div>
              </div>
            </div>
          ) : (
            /* Étape 2: Formulaire */
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Géométrie définie */}
              <div className={styles.geometryInfo}>
                ✅ Géométrie définie : <strong>{getGeometryTypeLabel()}</strong>
                <button
                  type="button"
                  className={styles.editGeometryButton}
                  onClick={() => setStep(1)}
                >
                  ✏️ Modifier
                </button>
              </div>

              {/* Titre */}
              <div className={styles.formGroup}>
                <label htmlFor="titre" className={styles.label}>
                  Titre de la mission *
                </label>
                <input
                  id="titre"
                  type="text"
                  value={formData.titre}
                  onChange={(e) => handleInputChange('titre', e.target.value)}
                  className={styles.input}
                  placeholder="Ex: Mission Anfa Nord"
                  disabled={loading}
                  required
                />
              </div>

              {/* Préfecture */}
              <div className={styles.formGroup}>
                <label htmlFor="prefecture" className={styles.label}>
                  Préfecture *
                </label>
                <select
                  id="prefecture"
                  value={formData.prefecture}
                  onChange={(e) => handleInputChange('prefecture', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                  required
                >
                  <option value="">Choisir une préfecture</option>
                  {prefectures.map(pref => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>

              {/* Commune */}
              <div className={styles.formGroup}>
                <label htmlFor="commune" className={styles.label}>
                  Commune *
                </label>
                <select
                  id="commune"
                  value={formData.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                  className={styles.select}
                  disabled={loading || !formData.prefecture}
                  required
                >
                  <option value="">Choisir une commune</option>
                  {formData.prefecture && communesParPrefecture[formData.prefecture]?.map(commune => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                </select>
              </div>

              {/* Agent assigné */}
              <div className={styles.formGroup}>
                <label htmlFor="agentId" className={styles.label}>
                  Agent assigné
                </label>
                <select
                  id="agentId"
                  value={formData.agentId}
                  onChange={(e) => handleInputChange('agentId', e.target.value)}
                  className={styles.select}
                  disabled={loading || !formData.commune}
                >
                  <option value="">Aucun agent assigné</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.nom} - {agent.commune}
                    </option>
                  ))}
                </select>
                {formData.commune && agents.length === 0 && (
                  <div className={styles.warning}>
                    ⚠️ Aucun agent disponible pour cette commune
                  </div>
                )}
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={styles.textarea}
                  placeholder="Description détaillée de la mission..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Création...' : ' Créer la mission'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionCreationModal;