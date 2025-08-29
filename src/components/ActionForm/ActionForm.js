import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  Input,
  Select,
  DatePicker,
  Button,
  Alert,
  Card,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Divider,
  notification
} from 'antd';
import {
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  CompassOutlined,
  CameraOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { validateAction, createAutoPV, ACTION_TYPES } from '../../utils/actionHelpers';
import mockApiService from '../../services/mockApi';
import { getCurrentPositionWithUI, formatCoordinates, validateCoordinates } from '../../utils/geolocationHelpers';
import { ActionPhotoUploader, DocumentUploader } from '../../components/FileUpload/DocumentUploader';
import { defaultUploadManager } from '../../utils/uploadHelpers';
import { validateBeforeAfterPhotos } from '../../utils/fileHelpers';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

// Schéma de validation Zod 
const actionFormSchema = z.object({
  type: z.enum(['DEMOLITION', 'SIGNALEMENT', 'NON_DEMOLITION'], {
    required_error: 'Le type d\'action est obligatoire',
    invalid_type_error: 'Type d\'action invalide'
  }),
  
  cibleType: z.enum(['MISSION', 'DOUAR'], {
    required_error: 'Le type de cible est obligatoire'
  }),
  
  cibleId: z.string({
    required_error: 'Veuillez sélectionner une cible'
  }).min(1, 'La sélection d\'une cible est obligatoire'),
  
  date: z.date({
    required_error: 'La date d\'exécution est obligatoire',
    invalid_type_error: 'Format de date invalide'
  }).refine(date => date <= new Date(), {
    message: 'La date ne peut pas être dans le futur'
  }),
  
  observations: z.string({
    required_error: 'Les observations sont obligatoires'
  })
  .min(10, 'Les observations doivent contenir au moins 10 caractères')
  .max(1000, 'Les observations ne peuvent pas dépasser 1000 caractères')
  .refine(text => text.trim().length >= 10, {
    message: 'Les observations ne peuvent pas être uniquement des espaces'
  }),
  
  montantAmende: z.number({
    invalid_type_error: 'Le montant doit être un nombre'
  })
  .min(100, 'Le montant minimum est de 100 DH')
  .max(100000, 'Le montant maximum est de 100 000 DH')
  .optional(),
  
  latitude: z.number({
    invalid_type_error: 'Latitude invalide'
  })
  .min(-90, 'Latitude invalide (min: -90)')
  .max(90, 'Latitude invalide (max: 90)')
  .optional(),
  
  longitude: z.number({
    invalid_type_error: 'Longitude invalide'
  })
  .min(-180, 'Longitude invalide (min: -180)')
  .max(180, 'Longitude invalide (max: 180)')
  .optional()
}).refine((data) => {
  if (data.type === 'DEMOLITION' && !data.montantAmende) {
    return false;
  }
  return true;
}).refine((data) => {
  // Validation coordonnées 
  const hasLat = data.latitude !== undefined && data.latitude !== null;
  const hasLng = data.longitude !== undefined && data.longitude !== null;
  return hasLat === hasLng;
}, {
  message: 'Les coordonnées latitude et longitude doivent être fournies ensemble',
  path: ['coordinates']
});

const DRAFT_KEY = 'actionForm_draft';

const ActionForm = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  initialValues = {},
  title = "Créer une nouvelle action",
  preselectedTarget = null,
  enableGeolocation = true,
  requirePhotos = false
}) => {
  const { user } = useAuth();
  
  // États locaux
  const [missions, setMissions] = useState([]);
  const [douars, setDouars] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedCible, setSelectedCible] = useState(null);
  const [pvPreview, setPvPreview] = useState(null);
  
  const [geoloading, setGeoLoading] = useState(false);
  const [geoPosition, setGeoPosition] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [photosValid, setPhotosValid] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
    trigger,
    getValues
  } = useForm({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      date: new Date(),
      type: '',
      cibleType: '',
      cibleId: '',
      observations: '',
      montantAmende: undefined,
      latitude: undefined,
      longitude: undefined,
      ...initialValues
    },
    mode: 'onChange' 
  });

  const watchedValues = watch();
  const watchedType = watch('type');
  const watchedCibleType = watch('cibleType');
  const watchedCibleId = watch('cibleId');

  const loadFormData = useCallback(async () => {
    try {
      const [missionsData, douarsData, agentsData] = await Promise.all([
        mockApiService.getMissions(),
        mockApiService.getDouars ? mockApiService.getDouars() : Promise.resolve([]),
        mockApiService.getUsers()
      ]);

      setMissions(missionsData || []);
      setDouars(douarsData || []);
      setAgents(agentsData?.filter(u => u.role === 'AGENT_AUTORITE') || []);
    } catch (error) {
      console.error('Erreur chargement données formulaire:', error);
      notification.error({
        message: 'Erreur de chargement',
        description: 'Impossible de charger les données du formulaire'
      });
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadFormData();
      
      checkDraftExists();
      
      if (preselectedTarget) {
        setValue('cibleType', preselectedTarget.type);
        setValue('cibleId', preselectedTarget.id);
        setSelectedCible(preselectedTarget.data);
      }
    }
  }, [visible, preselectedTarget, loadFormData, setValue]);

  const saveDraft = useCallback((data) => {
    if (typeof Storage !== 'undefined') {
      try {
        const draft = {
          ...data,
          date: data.date?.toISOString(),
          savedAt: new Date().toISOString(),
          userId: user.id
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setHasDraft(true);
      } catch (error) {
        console.warn('Erreur sauvegarde brouillon:', error);
      }
    }
  }, [user.id]);

  const loadDraft = useCallback(() => {
    if (typeof Storage !== 'undefined') {
      try {
        const draftStr = localStorage.getItem(DRAFT_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.userId === user.id) {
            Object.keys(draft).forEach(key => {
              if (key === 'date' && draft[key]) {
                setValue(key, new Date(draft[key]));
              } else if (key !== 'savedAt' && key !== 'userId') {
                setValue(key, draft[key]);
              }
            });
            
            notification.success({
              message: 'Brouillon restauré',
              description: `Sauvegardé le ${dayjs(draft.savedAt).format('DD/MM/YYYY à HH:mm')}`
            });
            
            return true;
          }
        }
      } catch (error) {
        console.warn('Erreur chargement brouillon:', error);
      }
    }
    return false;
  }, [setValue, user.id]);

  const clearDraft = useCallback(() => {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
    }
  }, []);

  const checkDraftExists = useCallback(() => {
    if (typeof Storage !== 'undefined') {
      try {
        const draftStr = localStorage.getItem(DRAFT_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          setHasDraft(draft.userId === user.id);
        }
      } catch (error) {
        setHasDraft(false);
      }
    }
  }, [user.id]);

  useEffect(() => {
    if (isDirty && isValid) {
      const timeoutId = setTimeout(() => {
        saveDraft(getValues());
      }, 2000); 

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, isValid, saveDraft, getValues]);

  const handleGetCurrentLocation = useCallback(async () => {
    setGeoLoading(true);
    
    try {
      const position = await getCurrentPositionWithUI({
        showLoadingMessage: true,
        showSuccessMessage: true,
        loadingMessage: 'Obtention position GPS...',
        successMessage: 'Position GPS obtenue'
      });

      setValue('latitude', position.latitude);
      setValue('longitude', position.longitude);

      setGeoPosition({
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.accuracy,
        source: 'gps',
        timestamp: new Date().toISOString()
      });

      notification.success({
        message: 'Position GPS enregistrée',
        description: `${formatCoordinates(position.latitude, position.longitude)} (±${position.accuracy}m)`,
        duration: 3
      });

    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      setGeoPosition(null);
    } finally {
      setGeoLoading(false);
    }
  }, [setValue]);

  const handleFilesChange = useCallback((files) => {
    setUploadedFiles(files);
    
    if (requirePhotos) {
      const validation = validateBeforeAfterPhotos(files);
      setPhotosValid(validation.valid);
    } else {
      setPhotosValid(true);
    }
  }, [requirePhotos]);

  const handleCibleChange = useCallback((cibleId, cibleType) => {
    const cibles = cibleType === 'MISSION' ? missions : douars;
    const cible = cibles.find(c => c.id === cibleId);
    setSelectedCible(cible);
    
    if (cibleType === 'MISSION' && cible?.geometry?.coordinates) {
      const [lng, lat] = cible.geometry.coordinates;
      setValue('latitude', lat);
      setValue('longitude', lng);
      setGeoPosition({
        lat,
        lng,
        source: 'mission',
        timestamp: new Date().toISOString()
      });
    }
    
    trigger(); 
  }, [missions, douars, setValue, trigger]);

  const generatePVPreview = useCallback((values) => {
    try {
      const cible = values.cibleType === 'MISSION' 
        ? missions.find(m => m.id === values.cibleId)
        : douars.find(d => d.id === values.cibleId);
      
      const mission = values.cibleType === 'MISSION' 
        ? cible 
        : missions.find(m => m.id === cible?.missionId);

      const agent = agents.find(a => a.id === user.id);

      if (cible && mission && agent) {
        const mockAction = {
          type: values.type,
          date: values.date?.toISOString(),
          observations: values.observations,
          montantAmende: values.montantAmende,
          coordinates: geoPosition ? [geoPosition.lat, geoPosition.lng] : null
        };

        const pv = createAutoPV ? createAutoPV(mockAction, mission, agent, cible) : {
          id: `pv_preview_${Date.now()}`,
          template: `PROCÈS-VERBAL - APERÇU\n\nType: ${ACTION_TYPES[values.type]?.label}\nAgent: ${user.nom}\nDate: ${dayjs(values.date).format('DD/MM/YYYY')}\n\nObservations:\n${values.observations || 'À compléter...'}`
        };
        
        setPvPreview(pv);
      }
    } catch (error) {
      console.error('Erreur génération prévisualisation PV:', error);
      setPvPreview(null);
    }
  }, [missions, douars, agents, user, geoPosition]);

  useEffect(() => {
    if (isValid && watchedValues.type && watchedValues.cibleId) {
      generatePVPreview(watchedValues);
    } else {
      setPvPreview(null);
    }
  }, [watchedValues, isValid, generatePVPreview]);

  const onSubmitForm = useCallback(async (data) => {
    try {
      if (requirePhotos && !photosValid) {
        notification.error({
          message: 'Photos manquantes',
          description: 'Photos avant/après requises pour ce type d\'action'
        });
        return;
      }

      if (data.latitude && data.longitude) {
        const coordValidation = validateCoordinates(data.latitude, data.longitude);
        if (!coordValidation.valid) {
          notification.error({
            message: 'Coordonnées invalides',
            description: coordValidation.errors.join(', ')
          });
          return;
        }
      }

      let uploadedFileResults = [];
      if (uploadedFiles.length > 0) {
        try {
          const uploadResult = await defaultUploadManager.handleFilesUpload(
            uploadedFiles.map(f => f.file),
            {
              category: 'action_files',
              metadata: {
                actionType: data.type,
                cibleType: data.cibleType,
                cibleId: data.cibleId,
                userId: user.id
              },
              showNotifications: false
            }
          );
          uploadedFileResults = uploadResult.results;
        } catch (uploadError) {
          console.warn('Erreur upload:', uploadError);
        }
      }

      const enrichedValues = {
        ...data,
        fichiers: uploadedFileResults.map(file => ({
          id: file.id,
          url: file.url,
          tempUrl: file.tempUrl,
          name: file.originalName,
          type: file.type,
          size: file.size,
          category: file.category,
          metadata: file.metadata
        })),
        geoMetadata: geoPosition || null,
        _uploadCount: uploadedFileResults.length
      };

      await onSubmit?.(enrichedValues);
      
      // Supprimer le brouillon après succès
      clearDraft();
      
      // Reset après succès
      reset();
      setSelectedCible(null);
      setPvPreview(null);
      setUploadedFiles([]);
      setGeoPosition(null);
      setPhotosValid(false);
      
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  }, [requirePhotos, photosValid, uploadedFiles, user.id, geoPosition, onSubmit, clearDraft, reset]);

  // Reset formulaire - mémorisé
  const handleCancel = useCallback(() => {
    reset();
    setSelectedCible(null);
    setPvPreview(null);
    setUploadedFiles([]);
    setGeoPosition(null);
    setPhotosValid(false);
    onClose?.();
  }, [reset, onClose]);

  const missionOptions = useMemo(() => 
    missions.map(item => (
      <Option key={item.id} value={item.id}>
        {item.nom || item.titre} ({item.commune}, {item.prefecture})
      </Option>
    )), [missions]
  );

  const douarOptions = useMemo(() => 
    douars.map(item => (
      <Option key={item.id} value={item.id}>
        {item.nom || item.titre} ({item.commune}, {item.prefecture})
      </Option>
    )), [douars]
  );

  const getFieldError = (fieldName) => {
    return errors[fieldName]?.message;
  };

  const hasFieldError = (fieldName) => {
    return !!errors[fieldName];
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          {title}
          {hasDraft && (
            <Tag color="orange" size="small">Brouillon disponible</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit(onSubmitForm)}
      confirmLoading={loading}
      width={1000}
      okText={`Créer l'action${uploadedFiles.length > 0 ? ` (${uploadedFiles.length} fichier${uploadedFiles.length > 1 ? 's' : ''})` : ''}`}
      cancelText="Annuler"
      styles={{
        body: { maxHeight: '75vh', overflow: 'auto' }
      }}
      okButtonProps={{
        disabled: !isValid || (requirePhotos && !photosValid)
      }}
      footer={[
        <Button key="draft" icon={<SaveOutlined />} onClick={() => saveDraft(getValues())} disabled={!isDirty}>
          Sauvegarder brouillon
        </Button>,
        hasDraft && (
          <Button key="load-draft" type="dashed" onClick={loadDraft}>
            Charger brouillon
          </Button>
        ),
        <Button key="cancel" onClick={handleCancel}>
          Annuler
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          disabled={!isValid || (requirePhotos && !photosValid)}
          onClick={handleSubmit(onSubmitForm)}
        >
          Créer l'action
        </Button>
      ].filter(Boolean)}
    >
      <Alert
        message="Création d'action avec documentation"
        description="Un procès-verbal sera automatiquement généré en brouillon. Les fichiers joints seront associés à l'action. Sauvegarde automatique activée."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {hasDraft && (
        <Alert
          message="Brouillon disponible"
          description="Un brouillon de ce formulaire existe. Cliquez sur 'Charger brouillon' pour le restaurer."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={loadDraft}>
              Charger
            </Button>
          }
        />
      )}

      <Row gutter={16}>
        <Col span={14}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Type d'action *
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select 
                  {...field} 
                  placeholder="Sélectionner le type d'action" 
                  size="large"
                  status={hasFieldError('type') ? 'error' : ''}
                  style={{ width: '100%' }}
                  aria-label="Sélectionner le type d'action"
                >
                  {Object.entries(ACTION_TYPES).map(([key, type]) => (
                    <Option key={key} value={key}>
                      <Space>
                        <span style={{ fontSize: '16px' }}>{type.icon}</span>
                        <div>
                          <Tag color={type.color}>{type.label}</Tag>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {type.description}
                          </Text>
                        </div>
                      </Space>
                    </Option>
                  ))}
                </Select>
              )}
            />
            {hasFieldError('type') && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {getFieldError('type')}
              </div>
            )}
          </div>

          <Row gutter={12}>
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Type de cible *
                </label>
                <Controller
                  name="cibleType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      placeholder="Mission/Douar"
                      disabled={!!preselectedTarget}
                      status={hasFieldError('cibleType') ? 'error' : ''}
                      style={{ width: '100%' }}
                      aria-label="Sélectionner le type de cible"
                    >
                      <Option value="MISSION">
                        <Space>
                          <EnvironmentOutlined />
                          Mission
                        </Space>
                      </Option>
                      {douars.length > 0 && (
                        <Option value="DOUAR">
                          <Space>
                            <EnvironmentOutlined />
                            Douar
                          </Space>
                        </Option>
                      )}
                    </Select>
                  )}
                />
                {hasFieldError('cibleType') && (
                  <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                    {getFieldError('cibleType')}
                  </div>
                )}
              </div>
            </Col>
            <Col span={16}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Cible *
                </label>
                <Controller
                  name="cibleId"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field}
                      placeholder={`Sélectionner ${watchedCibleType === 'MISSION' ? 'une mission' : 'un douar'}`}
                      disabled={!!preselectedTarget}
                      onChange={(value) => {
                        field.onChange(value);
                        handleCibleChange(value, watchedCibleType);
                      }}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      status={hasFieldError('cibleId') ? 'error' : ''}
                      style={{ width: '100%' }}
                      aria-label="Sélectionner la cible de l'action"
                    >
                      {watchedCibleType === 'MISSION' ? missionOptions : douarOptions}
                    </Select>
                  )}
                />
                {hasFieldError('cibleId') && (
                  <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                    {getFieldError('cibleId')}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Date d'exécution *
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker 
                  {...field}
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => field.onChange(date?.toDate())}
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Sélectionner la date"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  showToday
                  status={hasFieldError('date') ? 'error' : ''}
                  aria-label="Sélectionner la date d'exécution"
                />
              )}
            />
            {hasFieldError('date') && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {getFieldError('date')}
              </div>
            )}
          </div>

          {/* Coordonnées avec géolocalisation */}
          {enableGeolocation && (
            <Card size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
              <div style={{ marginBottom: 12 }}>
                <Space>
                  <Text strong>Position spécifique (optionnel)</Text>
                  <Button 
                    icon={<CompassOutlined />}
                    size="small"
                    type="link"
                    loading={geoloading}
                    onClick={handleGetCurrentLocation}
                    aria-label="Obtenir ma position GPS"
                  >
                    Ma position GPS
                  </Button>
                </Space>
              </div>

              {geoPosition && (
                <Alert
                  message={`Position ${geoPosition.source === 'gps' ? 'GPS' : 'de mission'} enregistrée`}
                  description={`${formatCoordinates(geoPosition.lat, geoPosition.lng)}${geoPosition.accuracy ? ` (±${geoPosition.accuracy}m)` : ''}`}
                  type="success"
                  size="small"
                  style={{ marginBottom: 12 }}
                />
              )}

              <Row gutter={12}>
                <Col span={12}>
                  <Controller
                    name="latitude"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                          Latitude
                        </label>
                        <Input 
                          {...field}
                          placeholder="33.5731" 
                          disabled
                          status={hasFieldError('latitude') ? 'error' : ''}
                          aria-label="Latitude"
                        />
                        {hasFieldError('latitude') && (
                          <div style={{ color: '#ff4d4f', fontSize: 11, marginTop: 2 }}>
                            {getFieldError('latitude')}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </Col>
                <Col span={12}>
                  <Controller
                    name="longitude"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                          Longitude
                        </label>
                        <Input 
                          {...field}
                          placeholder="-7.5898" 
                          disabled
                          status={hasFieldError('longitude') ? 'error' : ''}
                          aria-label="Longitude"
                        />
                        {hasFieldError('longitude') && (
                          <div style={{ color: '#ff4d4f', fontSize: 11, marginTop: 2 }}>
                            {getFieldError('longitude')}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Observations */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Observations détaillées *
            </label>
            <Controller
              name="observations"
              control={control}
              render={({ field }) => (
                <TextArea 
                  {...field}
                  rows={4}
                  placeholder="Décrivez précisément l'action réalisée, les conditions d'intervention, les constats effectués..."
                  maxLength={1000}
                  showCount
                  status={hasFieldError('observations') ? 'error' : ''}
                  aria-label="Saisir les observations détaillées de l'action"
                />
              )}
            />
            {hasFieldError('observations') && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                {getFieldError('observations')}
              </div>
            )}
          </div>

          {/* Montant amende (si démolition) */}
          {watchedType === 'DEMOLITION' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Montant de l'amende (DH) *
              </label>
              <Controller
                name="montantAmende"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    placeholder="Ex: 5000"
                    addonAfter="DH"
                    min={100}
                    max={100000}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    status={hasFieldError('montantAmende') ? 'error' : ''}
                    aria-label="Saisir le montant de l'amende en dirhams"
                  />
                )}
              />
              {hasFieldError('montantAmende') && (
                <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                  {getFieldError('montantAmende')}
                </div>
              )}
            </div>
          )}

          {/* Section upload de fichiers */}
          <Divider />
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>
                <CameraOutlined /> Documentation de l'action
              </Title>
              <Text type="secondary">
                {requirePhotos ? 
                  'Photos avant/après obligatoires' : 
                  'Photos et documents optionnels mais recommandés'
                }
              </Text>
            </div>

            {requirePhotos ? (
              <ActionPhotoUploader
                value={uploadedFiles}
                onChange={handleFilesChange}
                required={requirePhotos}
                disabled={loading}
              />
            ) : (
              <DocumentUploader
                value={uploadedFiles}
                onChange={handleFilesChange}
                fileType="ALL"
                maxFiles={5}
                title=""
              />
            )}

            {uploadedFiles.length > 0 && (
              <Alert
                message={`${uploadedFiles.length} fichier(s) prêt(s)`}
                description={photosValid ? 'Documentation complète' : 'Vérifiez les photos avant/après'}
                type={photosValid ? 'success' : 'warning'}
                size="small"
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        </Col>

        {/* Colonne droite - Informations contextuelles */}
        <Col span={10}>
          {/* Informations agent */}
          <Card size="small" title="Agent" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <UserOutlined style={{ marginRight: 8 }} />
                <Text strong>{user.nom}</Text>
              </div>
              <div>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                <Text type="secondary">{user.commune}, {user.prefecture}</Text>
              </div>
            </Space>
          </Card>

          {/* Informations cible sélectionnée */}
          {selectedCible && (
            <Card size="small" title="Cible sélectionnée" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>{selectedCible.nom || selectedCible.titre}</Text>
                </div>
                <div>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  <Text type="secondary">{selectedCible.commune}, {selectedCible.prefecture}</Text>
                </div>
                {selectedCible.population && (
                  <div>
                    <UserOutlined style={{ marginRight: 8 }} />
                    <Text type="secondary">{selectedCible.population} habitants</Text>
                  </div>
                )}
                {selectedCible.geometry?.coordinates && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Coordonnées: {formatCoordinates(
                        selectedCible.geometry.coordinates[1], 
                        selectedCible.geometry.coordinates[0]
                      )}
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Position GPS */}
          {geoPosition && (
            <Card size="small" title="Position enregistrée" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>{formatCoordinates(geoPosition.lat, geoPosition.lng)}</Text>
                </div>
                <div>
                  <Text type="secondary">
                    Source: {geoPosition.source === 'gps' ? 'GPS' : 'Mission'}
                  </Text>
                </div>
                {geoPosition.accuracy && (
                  <div>
                    <Text type="secondary">Précision: ±{geoPosition.accuracy}m</Text>
                  </div>
                )}
              </Space>
            </Card>
          )}

          {/* Prévisualisation PV */}
          {pvPreview && (
            <Card 
              size="small" 
              title="Aperçu du PV qui sera généré"
              style={{ marginBottom: 16 }}
            >
              <div style={{ 
                background: '#fafafa',
                padding: 12,
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <pre style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '10px',
                  lineHeight: '1.4',
                  margin: 0,
                  whiteSpace: 'pre-line'
                }}>
                  {pvPreview.template?.substring(0, 500)}...
                </pre>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <Space>
                <Tag color="orange">Brouillon</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  PV #{pvPreview.id}
                </Text>
              </Space>
            </Card>
          )}

          {/* État validation */}
          <Card size="small" title="État du formulaire" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color={isValid ? 'green' : 'red'}>
                  {isValid ? 'Formulaire valide' : 'Formulaire invalide'}
                </Tag>
              </div>
              {isDirty && (
                <div>
                  <Tag color="orange">Modifications non sauvegardées</Tag>
                </div>
              )}
              {Object.keys(errors).length > 0 && (
                <div>
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {Object.keys(errors).length} erreur(s) à corriger
                  </Text>
                </div>
              )}
            </Space>
          </Card>

          {/* Aide contextuelle */}
          <Card size="small" title="Aide">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Démolition:</strong> Action de destruction de construction illégale. Génère une amende obligatoire.
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Signalement:</strong> Constat d'infraction sans action immédiate. Pour documentation.
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Non-démolition:</strong> Constat de report d'intervention avec justification.
              </Text>
              {enableGeolocation && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>GPS:</strong> Utilisez la géolocalisation pour une position précise de l'intervention.
                </Text>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                💾 Sauvegarde automatique du brouillon toutes les 2 secondes
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default ActionForm;

export const ActionFormWithPhotos = (props) => (
  <ActionForm
    {...props}
    requirePhotos={true}
    enableGeolocation={true}
    title="Créer une action avec documentation photographique"
  />
);

export const ActionFormSimple = (props) => (
  <ActionForm
    {...props}
    requirePhotos={false}
    enableGeolocation={false}
    title="Créer une action simple"
  />
);

export const ActionFormGeolocation = (props) => (
  <ActionForm
    {...props}
    requirePhotos={false}
    enableGeolocation={true}
    title="Créer une action avec géolocalisation"
  />
);