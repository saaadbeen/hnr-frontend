
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layout, Card, Form, Input, Select, DatePicker, Button, Row, Col, 
  Typography, Space, Alert, notification, Tag, Upload, Divider
} from 'antd';
import { 
  AimOutlined, FileTextOutlined, ArrowLeftOutlined, SaveOutlined, 
  CheckOutlined, CompassOutlined, 
  DeleteOutlined, PlayCircleOutlined, CameraOutlined, UploadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import mockApiService from '../../services/mockApi';
import { ACTION_TYPES } from '../../utils/actionHelpers';
import { 
  getCurrentPositionWithUI, 
  formatCoordinates, 
  validateCoordinates, 
  getCommuneCoordinates 
} from '../../utils/geolocationHelpers';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const MAP_ZOOM = 13;

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fileToMeta = async (file, slot) => ({
  slot,
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified,
  preview: await toBase64(file),
});

function NouvelleAction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const fromChange = location.state?.changement || null;

  const [form] = Form.useForm();

  // Carte
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Localisation 
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const isSelectingRef = useRef(false);
  useEffect(() => { isSelectingRef.current = isSelectingLocation; }, [isSelectingLocation]);

  const [loading, setLoading] = useState(false);
  const [createPvNow, setCreatePvNow] = useState(false);

  const [photoBefore, setPhotoBefore] = useState(null);
  const [photoAfter, setPhotoAfter] = useState(null);

  const loadLeaflet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (window.L && window.L.version) { setLeafletLoaded(true); return; }

    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setTimeout(() => {
          if (window.L && window.L.version) {
            try {
              delete window.L.Icon.Default.prototype._getIconUrl;
              window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              });
            } catch {}
            setLeafletLoaded(true);
          }
        }, 100);
      };
      script.onerror = () => console.error('Erreur chargement Leaflet');
      document.head.appendChild(script);
    }
  }, []);
  useEffect(() => { loadLeaflet(); }, [loadLeaflet]);

  const getMapCenter = useCallback(() => {
    const base = fromChange?.commune || user?.commune || 'Anfa';
    const communeCoords = getCommuneCoordinates(base);
    if (communeCoords) return [communeCoords.lat, communeCoords.lng];
    const fallback = getCommuneCoordinates('Anfa');
    return fallback ? [fallback.lat, fallback.lng] : [33.59, -7.664];
  }, [user, fromChange]);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !window.L) return;

    const mapCenter = getMapCenter();
    const map = window.L.map(mapRef.current, {
      center: mapCenter,
      zoom: MAP_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    const communeCircle = window.L.circle(mapCenter, {
      color: '#1890ff',
      fillColor: '#1890ff',
      fillOpacity: 0.1,
      radius: 2000,
      weight: 2
    }).addTo(map);

    const communeMarker = window.L.marker(mapCenter, {
      icon: window.L.divIcon({
        html: `<div style="
          width:28px;height:28px;background:#52c41a;border:2px solid #fff;border-radius:50%;
          display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);">${(fromChange?.commune || user?.commune || 'CA').substring(0,2).toUpperCase()}</div>`,
        className: 'commune-center-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    }).addTo(map);

    communeMarker.bindPopup(
      `<strong>Centre de ${fromChange?.commune || user?.commune || 'la commune'}</strong><br/>
       Zone de métier délimitée par le cercle bleu`
    );

    const onMapClick = (e) => {
      if (!isSelectingRef.current) return;
      const { lat, lng } = e.latlng;
      setPointOnMap(lat, lng, 'manual');
    };

    map.on('click', onMapClick);
    mapInstanceRef.current = map;

    setTimeout(() => { 
      map.invalidateSize(); 
      setMapReady(true);
    }, 200);

    return () => {
      try { map.off('click', onMapClick); } catch {}
      try { clearMarker(); } catch {}
      try { map.remove(); } catch {}
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded, getMapCenter, user, fromChange]);

  const setPointOnMap = (lat, lng, source = 'manual') => {
    if (!mapInstanceRef.current || !window.L) return;

    clearMarker();

    const icon = window.L.divIcon({
      html: `<div style="
        width:32px;height:32px;background:#ff4d4f;border:3px solid #fff;border-radius:50%;
        display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:bold;
        box-shadow:0 3px 8px rgba(0,0,0,0.3);cursor:pointer;">📍</div>`,
      className: 'action-point-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    
    markerRef.current = window.L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
    markerRef.current.bindPopup(`
      <strong>Point d'intervention</strong><br/>
      Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}<br/>
      <small>Source: ${source === 'gps' ? 'GPS' : 'Sélection manuelle'}</small>
    `);

    try { 
      mapInstanceRef.current.setView([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15)); 
    } catch {}

    setSelectedPosition({ lat, lng, source });
    setIsSelectingLocation(false);
    form.setFieldsValue({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    });
  };

  const clearMarker = () => {
    if (markerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.removeLayer(markerRef.current); } catch {}
      markerRef.current = null;
    }
  };

  const startLocationSelection = () => {
    setIsSelectingLocation(true);
    notification.info({
      message: 'Mode sélection activé',
      description: 'Cliquez sur la carte pour choisir l’emplacement exact.',
      duration: 3
    });
  };
  
  const resetLocation = () => {
    setSelectedPosition(null);
    setIsSelectingLocation(false);
    clearMarker();
    form.setFieldsValue({ latitude: undefined, longitude: undefined });
  };

  // GPS
  const handleGetCurrentLocation = async () => {
    try {
      const pos = await getCurrentPositionWithUI({
        showLoadingMessage: true,
        showSuccessMessage: true,
        loadingMessage: 'Acquisition de votre position GPS...',
        successMessage: 'Position GPS obtenue'
      });
      setPointOnMap(pos.latitude, pos.longitude, 'gps');
    } catch (e) {
      console.error('Erreur géolocalisation:', e);
    }
  };

  // Préremplissage
  useEffect(() => {
    const commune = fromChange?.commune || user?.commune || 'Anfa';
    const prefecture = fromChange?.prefecture || user?.prefecture || "Préfecture d'arrondissements de Casablanca-Anfa";
    form.setFieldsValue({
      date: dayjs(),
      commune,
      prefecture,
      changementId: fromChange?.id || undefined,
    });
  }, [user, form, fromChange]);

  // Upload photo
  const beforeUploadHandler = async (file, which) => {
    const isImage = /image\/(png|jpeg|jpg)/i.test(file.type);
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isImage) return Upload.LIST_IGNORE;
    if (!isLt10M) return Upload.LIST_IGNORE;
    const meta = await fileToMeta(file, which === 'before' ? 'BEFORE' : 'AFTER');
    if (which === 'before') setPhotoBefore(meta);
    else setPhotoAfter(meta);
    return false;
  };
  const clearPhoto = (which) => { if (which === 'before') setPhotoBefore(null); else setPhotoAfter(null); };

  const canSubmit = !!selectedPosition;

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (!canSubmit) {
        notification.error({ message: 'Emplacement manquant', description: 'Sélectionnez un point sur la carte.' });
        return;
      }

      const v = validateCoordinates(selectedPosition.lat, selectedPosition.lng);
      if (!v.valid) {
        notification.error({ message: 'Coordonnées invalides', description: v.errors.join(', ') });
        return;
      }

      const geometry = { type: 'Point', coordinates: [selectedPosition.lng, selectedPosition.lat] };
      const uploadedFiles = [photoBefore, photoAfter].filter(Boolean);

      const payload = {
        type: values.type,
        date: values.date.toDate(),
        geometry,
        prefecture: values.prefecture,
        commune: values.commune,
        userId: user.id,
        observations: values.observations || '',
        location: { lat: selectedPosition.lat, lng: selectedPosition.lng, source: selectedPosition.source || 'manual' },
        photos: uploadedFiles,
        changementId: values.changementId || undefined, // ← lien au changement
      };

      const createdAction = await mockApiService.createAction(payload);

      if (createPvNow && createdAction.pvId) {
        notification.success({ message: 'Action créée avec PV', description: 'Ouverture de l’éditeur…' });
        navigate(`/actions/pv/${createdAction.pvId}`);
        return;
      }

      notification.success({ message: 'Action créée', description: fromChange ? `Liée au changement ${fromChange.id}` : undefined });
      navigate('/actions');
    } catch (error) {
      notification.error({ message: 'Erreur de création', description: error.message || "Impossible de créer l'action." });
    } finally {
      setLoading(false);
    }
  };

  const renderLocationControls = () => {
    if (selectedPosition) {
      return (
        <Space>
          <Tag color="success" icon={<CheckOutlined />}>
            Emplacement sélectionné ({selectedPosition.source === 'gps' ? 'GPS' : 'Manuel'})
          </Tag>
          <Button icon={<DeleteOutlined />} onClick={resetLocation} size="small">
            Changer
          </Button>
        </Space>
      );
    }
    return (
      <Space>
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />} 
          onClick={startLocationSelection}
          disabled={isSelectingLocation}
        >
          {isSelectingLocation ? 'Cliquez sur la carte…' : 'Sélectionner sur carte'}
        </Button>
        <Button icon={<CompassOutlined />} onClick={handleGetCurrentLocation}>
          Utiliser GPS
        </Button>
      </Space>
    );
  };

  const photoCount = (photoBefore ? 1 : 0) + (photoAfter ? 1 : 0);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/actions')} style={{ marginBottom: 16 }}>
          Retour aux actions
        </Button>

        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              <FileTextOutlined /> Nouvelle action - {fromChange?.commune || user?.commune}
            </Title>
            <Text type="secondary">
              Créer une intervention dans votre zone. Carte centrée sur {fromChange?.commune || user?.commune}.
            </Text>
          </div>

          {/* Bloc "Changement lié" si la page vient de la liste des changements */}
          {fromChange && (
            <Alert
              type="info"
              showIcon
              message={
                <Space wrap>
                  <strong>Changement lié :</strong>
                  <Tag>{fromChange.id}</Tag>
                  <Tag color="blue">{fromChange.type}</Tag>
                  <Tag color={fromChange.statut === 'DETECTE' ? 'red' : fromChange.statut === 'EN_TRAITEMENT' ? 'orange' : 'green'}>
                    {fromChange.statut}
                  </Tag>
                  <span>{fromChange.description}</span>
                </Space>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSubmit}
            initialValues={{ date: dayjs() }}
          >
            {/* Champ caché pour lier le changement */}
            <Form.Item name="changementId" style={{ display: 'none' }}>
              <Input />
            </Form.Item>

            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <Card title="Informations de l'intervention" size="small" style={{ marginBottom: 16 }}>
                  <Form.Item 
                    name="type" 
                    label="Type d'action" 
                    rules={[{ required: true, message: 'Le type d\'action est requis' }]}
                  >
                    <Select placeholder="Sélectionner le type d'intervention">
                      {Object.entries(ACTION_TYPES).map(([key, cfg]) => (
                        <Option key={key} value={key}>
                          <strong>{cfg.label}</strong>
                          {cfg.description && <div style={{ fontSize: '12px', color: '#666' }}>{cfg.description}</div>}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item 
                    name="date" 
                    label="Date et heure d'intervention" 
                    rules={[{ required: true, message: 'La date est requise' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      showTime 
                      format="DD/MM/YYYY HH:mm" 
                      placeholder="Sélectionner la date et l'heure"
                    />
                  </Form.Item>

                  <Form.Item name="observations" label="Observations et constatations">
                    <Input.TextArea 
                      rows={4} 
                      placeholder="Détaillez l'intervention…"
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>
                </Card>

                <Card title={<span><CameraOutlined /> Documentation photographique</span>} size="small">
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Upload.Dragger
                        accept="image/*"
                        maxCount={1}
                        beforeUpload={(f) => beforeUploadHandler(f, 'before')}
                        multiple={false}
                        showUploadList={false}
                        style={{ marginBottom: 8 }}
                      >
                        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                        <p className="ant-upload-text">Photo <strong>AVANT</strong> intervention</p>
                        <p className="ant-upload-hint">JPG, PNG • Max 10MB</p>
                      </Upload.Dragger>
                      {photoBefore && (
                        <div style={{ textAlign: 'center' }}>
                          <img src={photoBefore.preview} alt="avant" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 6 }} />
                          <Button size="small" style={{ marginTop: 4 }} onClick={() => clearPhoto('before')}>Retirer</Button>
                        </div>
                      )}
                    </Col>
                    <Col xs={24} md={12}>
                      <Upload.Dragger
                        accept="image/*"
                        maxCount={1}
                        beforeUpload={(f) => beforeUploadHandler(f, 'after')}
                        multiple={false}
                        showUploadList={false}
                        style={{ marginBottom: 8 }}
                      >
                        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                        <p className="ant-upload-text">Photo <strong>APRÈS</strong> intervention</p>
                        <p className="ant-upload-hint">JPG, PNG • Max 10MB</p>
                      </Upload.Dragger>
                      {photoAfter && (
                        <div style={{ textAlign: 'center' }}>
                          <img src={photoAfter.preview} alt="après" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 6 }} />
                          <Button size="small" style={{ marginTop: 4 }} onClick={() => clearPhoto('after')}>Retirer</Button>
                        </div>
                      )}
                    </Col>
                  </Row>

                  <Divider style={{ margin: '16px 0 8px 0' }} />
                  <Text type={photoCount === 2 ? 'success' : photoCount === 1 ? 'warning' : 'secondary'}>
                    {photoCount}/2 photo(s) ajoutée(s)
                  </Text>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Informations administratives" size="small" style={{ marginBottom: 16 }}>
                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Item name="prefecture" label="Préfecture" rules={[{ required: true }]}>
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="commune" label="Commune/Arrondissement" rules={[{ required: true }]}>
                        <Input disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
                        <Input placeholder="33.567033" disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
                        <Input placeholder="-7.627690" disabled />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title={`Emplacement précis - ${fromChange?.commune || user?.commune}`} size="small">
                  {selectedPosition ? (
                    <Alert
                      type="success"
                      showIcon
                      icon={<CheckOutlined />}
                      message="Emplacement sélectionné"
                      description={`${formatCoordinates(selectedPosition.lat, selectedPosition.lng)} • Source: ${selectedPosition.source === 'gps' ? 'GPS' : 'Manuel'}`}
                      style={{ marginBottom: 12 }}
                    />
                  ) : (
                    <Alert
                      type={isSelectingLocation ? 'warning' : 'info'}
                      showIcon
                      icon={<AimOutlined />}
                      message={isSelectingLocation ? 'Mode sélection actif' : 'Emplacement requis'}
                      description={isSelectingLocation 
                        ? 'Cliquez sur la carte pour définir l’emplacement'
                        : 'Choisissez l’emplacement précis de l’intervention'}
                      style={{ marginBottom: 12 }}
                    />
                  )}

                  <div style={{ marginBottom: 12 }}>
                    {renderLocationControls()}
                  </div>

                  <div
                    ref={mapRef}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 400,
                      borderRadius: 8,
                      border: '2px solid #f0f0f0',
                      overflow: 'hidden',
                      background: '#f7f7f7',
                      cursor: isSelectingLocation ? 'crosshair' : 'default'
                    }}
                  />
                  
                  {!mapReady && leafletLoaded && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.9)',
                      padding: 16,
                      borderRadius: 8
                    }}>
                      <Text type="secondary">Initialisation de la carte…</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Boutons */}
            <div style={{ marginTop: 24, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Space>
                <Button onClick={() => navigate('/actions')}>Annuler</Button>
                <Button 
                  onClick={() => { setCreatePvNow(false); form.submit(); }} 
                  icon={<SaveOutlined />} 
                  disabled={!canSubmit} 
                  loading={loading && !createPvNow}
                >
                  Créer l'action
                </Button>
                <Button 
                  type="primary"
                  onClick={() => { setCreatePvNow(true); form.submit(); }} 
                  icon={<FileTextOutlined />} 
                  disabled={!canSubmit} 
                  loading={loading && createPvNow}
                >
                  Créer + Préparer le PV
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}

export default NouvelleAction;
