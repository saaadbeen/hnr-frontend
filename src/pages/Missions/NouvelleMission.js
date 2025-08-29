import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Layout, Card, Button, Space, Typography, Form,
  Input, Select, Row, Col, notification, Alert, DatePicker, Tag, Tooltip, Avatar
} from 'antd';
import {
  EnvironmentOutlined, SaveOutlined, ArrowLeftOutlined,
  AimOutlined, CheckOutlined, DeleteOutlined, UndoOutlined,
  PlayCircleOutlined, StopOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import mockApi from '../../services/mockApi';
import { COMMUNES_BY_PREFECTURE } from '../../services/mockData';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const MAP_CENTER = [33.6, -7.4];
const MAP_ZOOM = 11;

export default function NouvelleMission() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [prefecture, setPrefecture] = useState();
  const [commune, setCommune] = useState();
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState();
  const [submitting, setSubmitting] = useState(false);

  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [drawingMode, setDrawingMode] = useState('inactive');

  const drawingModeRef = useRef('inactive');
  const polygonPointsRef = useRef([]);
  useEffect(() => { drawingModeRef.current = drawingMode; }, [drawingMode]);
  useEffect(() => { polygonPointsRef.current = polygonPoints; }, [polygonPoints]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polygonRef = useRef(null);
  const polylineRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const prefectures = useMemo(() => {
    return Object.keys(COMMUNES_BY_PREFECTURE).sort();
  }, []);

  const communesDisponibles = useMemo(() => {
    if (!prefecture) return [];
    return COMMUNES_BY_PREFECTURE[prefecture] || [];
  }, [prefecture]);

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

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current || !window.L) return;

    try {
      mapRef.current.innerHTML = '';

      const map = window.L.map(mapRef.current, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      const onMapClick = (e) => {
        if (drawingModeRef.current !== 'drawing') return;

        const { lat, lng } = e.latlng;
        const newPoint = [lat, lng];
        const current = polygonPointsRef.current;
        const updated = [...current, newPoint];

        setPolygonPoints(updated);
        polygonPointsRef.current = updated;

        addMarker(newPoint, String(updated.length));
        if (updated.length >= 2) updatePolyline(updated);

        if (updated.length === 1) {
          notification.info({
            message: 'Premier point défini',
            description: 'Continuez à cliquer pour dessiner (au moins 3 points).',
            duration: 3
          });
        }
      };

      map.on('click', onMapClick);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 200);

      return () => {
        try { map.off('click', onMapClick); } catch {}
        try { clearAllLayers(); } catch {}
        try { map.remove(); } catch {}
        mapInstanceRef.current = null;
      };
    } catch (e) {
      console.error('Erreur init carte:', e);
    }
  }, [leafletLoaded]);

  const addMarker = (position, label) => {
    if (!mapInstanceRef.current || !window.L) return;

    const icon = window.L.divIcon({
      html: `<div style="
        width:24px;height:24px;background:#1890ff;border:2px solid #fff;border-radius:50%;
        display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      ">${label}</div>`,
      className: 'polygon-point-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = window.L.marker(position, { icon });
    marker.addTo(mapInstanceRef.current);
    markersRef.current.push(marker);
  };

  const updatePolyline = (points) => {
    if (!mapInstanceRef.current || !window.L || points.length < 2) return;

    if (polylineRef.current) {
      try { mapInstanceRef.current.removeLayer(polylineRef.current); } catch {}
      polylineRef.current = null;
    }

    const polyline = window.L.polyline(points, {
      color: '#1890ff',
      weight: 2,
      opacity: 0.8,
      dashArray: '8,4'
    });

    polyline.addTo(mapInstanceRef.current);
    polylineRef.current = polyline;
  };

  const finishPolygon = (pointsInput) => {
    const points = pointsInput && pointsInput.length ? pointsInput : polygonPointsRef.current;
    if (!mapInstanceRef.current || !window.L || points.length < 3) return;

    if (polylineRef.current) {
      try { mapInstanceRef.current.removeLayer(polylineRef.current); } catch {}
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      try { mapInstanceRef.current.removeLayer(polygonRef.current); } catch {}
      polygonRef.current = null;
    }

    const polygon = window.L.polygon(points, {
      color: '#52c41a',
      fillColor: '#52c41a',
      fillOpacity: 0.15,
      weight: 3,
      opacity: 0.8
    }).addTo(mapInstanceRef.current);
    polygonRef.current = polygon;

    const geometry = {
      type: 'Polygon',
      coordinates: [
        [...points.map(([la, ln]) => [ln, la]), [points[0][1], points[0][0]]] 
      ]
    };

    setSelectedGeometry(geometry);
    setDrawingMode('complete');
    drawingModeRef.current = 'complete';

    try {
      const bounds = polygon.getBounds();
      if (bounds.isValid()) mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    } catch {}

    notification.success({
      message: "Zone d'intervention définie",
      description: `Polygone créé avec ${points.length} points — géométrie stockée`,
      duration: 3
    });
  };

  const clearAllLayers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(m => { try { mapInstanceRef.current.removeLayer(m); } catch {} });
    markersRef.current = [];

    if (polylineRef.current) {
      try { mapInstanceRef.current.removeLayer(polylineRef.current); } catch {}
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      try { mapInstanceRef.current.removeLayer(polygonRef.current); } catch {}
      polygonRef.current = null;
    }
  };

  const startDrawing = () => {
    clearAllLayers();
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    setSelectedGeometry(null);
    setDrawingMode('drawing');
    drawingModeRef.current = 'drawing';

    notification.info({
      message: 'Mode dessin activé',
      description: 'Cliquez sur la carte pour poser des sommets (au moins 3). Cliquez ensuite sur "Terminer le polygone".',
      duration: 4
    });
  };

  const resetPolygon = () => {
    clearAllLayers();
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    setSelectedGeometry(null);
    setDrawingMode('inactive');
    drawingModeRef.current = 'inactive';

    notification.info({
      message: 'Zone effacée',
      description: 'Vous pouvez redessiner une nouvelle zone.'
    });
  };

  const undoLastPoint = () => {
    const current = polygonPointsRef.current;
    if (!current.length) return;

    const newPoints = current.slice(0, -1);
    setPolygonPoints(newPoints);
    polygonPointsRef.current = newPoints;

    clearAllLayers();
    newPoints.forEach((pt, idx) => addMarker(pt, String(idx + 1)));
    if (newPoints.length >= 2) updatePolyline(newPoints);

    if (newPoints.length < 3) {
      setSelectedGeometry(null);
      setDrawingMode('drawing');
      drawingModeRef.current = 'drawing';
      if (polygonRef.current) {
        try { mapInstanceRef.current.removeLayer(polygonRef.current); } catch {}
        polygonRef.current = null;
      }
    }

    notification.info({
      message: 'Dernier point supprimé',
      description: `${newPoints.length} point(s) restant(s)`
    });
  };

  useEffect(() => {
    if (!user) return;
    
    const userPrefecture = prefectures.find(pref => 
      pref.toLowerCase().includes(user.prefecture?.toLowerCase()) ||
      user.prefecture?.toLowerCase().includes(pref.toLowerCase())
    ) || prefectures[0]; 

    const userCommune = user.commune || 'Anfa';
    
    setPrefecture(userPrefecture);
    setCommune(userCommune);

    form.setFieldsValue({
      prefecture: userPrefecture,
      commune: userCommune,
      dateEnvoi: dayjs(),
    });

    loadAgents(userCommune, userPrefecture, true);
  }, [user, prefectures, form]);

  const loadAgents = async (comm, pref, trySelectCurrent = false) => {
    try {
      const list = await mockApi.getAgentsByCommune(comm, pref);
      setAgents(list);
      let selected;
      if (trySelectCurrent && user && list.some(a => a.id === user.id)) {
        selected = user.id;
      } else if (list.length === 1) {
        selected = list[0].id;
      }
      setAgentId(selected);
      form.setFieldValue('agent', selected);
    } catch {
      setAgents([]);
      setAgentId(undefined);
      form.setFieldValue('agent', undefined);
    }
  };

  const onPrefChange = (val) => {
    setPrefecture(val);
    setCommune(''); 
    setAgentId(undefined);
    form.setFieldsValue({
      commune: undefined,
      agent: undefined
    });
  };

  const onCommuneChange = (val) => {
    setCommune(val);
    setAgentId(undefined);
    form.setFieldValue('agent', undefined);
    if (prefecture) loadAgents(val, prefecture);
  };

  const canSubmit = !!(prefecture && commune && agentId && selectedGeometry && selectedGeometry.type === 'Polygon');

  const onSubmit = async (values) => {
    if (!canSubmit) {
      notification.error({
        message: 'Informations incomplètes',
        description: selectedGeometry?.type !== 'Polygon'
          ? "Veuillez dessiner une zone d'intervention (polygone)."
          : 'Veuillez remplir tous les champs obligatoires.'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        titre: values.titre,
        description: values.description || '',
        prefecture,
        commune,
        assignedUserIds: [agentId],
        geometry: selectedGeometry,
        createdByUserId: user.id,
        statut: 'PLANIFIEE',
        dateEnvoi: values.dateEnvoi ? values.dateEnvoi.toDate() : new Date(),
        type: 'POLYGON',
        metadata: {
          pointCount: polygonPoints.length,
          createdAt: new Date().toISOString(),
          coordinates: polygonPoints
        }
      };

      await mockApi.createMission(payload);

      notification.success({
        message: 'Mission créée avec succès',
        description: `Mission polygonale assignée à ${commune} — géométrie sauvegardée`
      });

      navigate('/missions');
    } catch (e) {
      notification.error({
        message: 'Erreur de création',
        description: e.message || 'Impossible de créer la mission'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatGeometryDisplay = (geometry) => {
    if (!geometry) return null;
    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
      const pointCount = geometry.coordinates[0].length - 1;
      return `Polygone fermé (${pointCount} sommets)`;
    }
    return 'Zone définie';
  };

  const getAgentInitials = (nom) => {
    if (!nom) return 'A';
    return nom.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (id) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068', '#108ee9'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // UI
  const renderDrawingControls = () => {
    switch (drawingMode) {
      case 'inactive':
        return (
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startDrawing}
            >
              Commencer le dessin
            </Button>
          </Space>
        );

      case 'drawing':
        return (
          <Space wrap>
            <Tag color="processing">
              Mode dessin actif ({polygonPoints.length} point{polygonPoints.length > 1 ? 's' : ''})
            </Tag>
            <Tooltip title="Terminer et fermer le polygone">
              <Button
                type="primary"
                size="small"
                onClick={() => finishPolygon()}
                disabled={polygonPoints.length < 3}
              >
                Terminer le polygone
              </Button>
            </Tooltip>
            <Tooltip title="Annuler le dernier point">
              <Button
                icon={<UndoOutlined />}
                onClick={undoLastPoint}
                disabled={polygonPoints.length === 0}
                size="small"
              >
                Annuler
              </Button>
            </Tooltip>
            <Button
              icon={<StopOutlined />}
              onClick={resetPolygon}
              size="small"
            >
              Arrêter
            </Button>
          </Space>
        );

      case 'complete':
        return (
          <Space>
            <Tag color="success" icon={<CheckOutlined />}>
              Zone définie et stockable
            </Tag>
            <Button
              icon={<DeleteOutlined />}
              onClick={resetPolygon}
              size="small"
            >
              Redessiner
            </Button>
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/missions')}
          style={{ marginBottom: 16 }}
        >
          Retour aux missions
        </Button>

        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              <EnvironmentOutlined /> Nouvelle mission
            </Title>
            <Text type="secondary">Création d'une mission de terrain avec zone d'intervention polygonale</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ dateEnvoi: dayjs() }}
          >
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <Card title="Informations de base" size="small" style={{ marginBottom: 16 }}>
                  <Form.Item
                    name="titre"
                    label="Titre"
                    rules={[{ required: true, message: 'Titre requis' }]}
                  >
                    <Input placeholder="Ex: Habitat non réglementaire - Anfa Nord" />
                  </Form.Item>

                  <Form.Item
                    name="dateEnvoi"
                    label="Date d'envoi"
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      showTime
                      format="DD/MM/YYYY HH:mm"
                    />
                  </Form.Item>

                  <Form.Item name="description" label="Description">
                    <Input.TextArea
                      rows={4}
                      placeholder="Détails de la mission, objectifs, instructions particulières..."
                    />
                  </Form.Item>
                </Card>

                <Card title="Assignation" size="small">
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="prefecture"
                        label="Préfecture"
                        rules={[{ required: true, message: 'Préfecture obligatoire' }]}
                      >
                        <Select
                          placeholder="Sélectionner une préfecture"
                          onChange={onPrefChange}
                          value={prefecture}
                          showSearch
                          optionFilterProp="children"
                        >
                          {prefectures.map(pref => (
                            <Option key={pref} value={pref}>
                              {pref}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="commune"
                        label="Commune"
                        rules={[{ required: true, message: 'Commune obligatoire' }]}
                      >
                        <Select
                          placeholder={prefecture ? "Sélectionner une commune" : "Sélectionnez d'abord une préfecture"}
                          onChange={onCommuneChange}
                          value={commune}
                          disabled={!prefecture}
                          showSearch
                          optionFilterProp="children"
                        >
                          {communesDisponibles.map(comm => (
                            <Option key={comm} value={comm}>
                              {comm}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="agent"
                    label="Agent assigné"
                    rules={[{ required: true, message: 'Agent assigné obligatoire' }]}
                  >
                    <Select
                      placeholder={
                        !commune 
                          ? "Sélectionnez d'abord une commune"
                          : agents.length === 0
                            ? "Aucun agent disponible dans cette zone"
                            : "Choisir un agent"
                      }
                      value={agentId}
                      disabled={!commune || agents.length === 0}
                      showSearch
                      optionFilterProp="children"
                      size="large"
                    >
                      {agents.map((agent) => (
                        <Option key={agent.id} value={agent.id}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '8px 0',
                            gap: '12px'
                          }}>
                            <Avatar 
                              size={40}
                              style={{ 
                                backgroundColor: getAvatarColor(agent.id),
                                flexShrink: 0
                              }}
                              icon={!agent.nom ? <UserOutlined /> : null}
                            >
                              {agent.nom ? getAgentInitials(agent.nom) : null}
                            </Avatar>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontWeight: 600, 
                                fontSize: '14px',
                                marginBottom: '2px',
                                color: '#262626'
                              }}>
                                {agent.nom}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#8c8c8c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span>{agent.commune}</span>
                                <span>•</span>
                                <span>{agent.email}</span>
                              </div>
                              {agent.telephone && (
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: '#bfbfbf',
                                  marginTop: '2px'
                                }}>
                                  {agent.telephone}
                                </div>
                              )}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {agents.length === 0 && commune && (
                    <Alert
                      message="Aucun agent disponible"
                      description={`Aucun agent d'autorité n'est assigné à la commune ${commune}. Contactez l'administration pour assigner un agent à cette zone.`}
                      type="warning"
                      showIcon
                      size="small"
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="Zone d'intervention" size="small">
                  {/* État de la zone */}
                  {selectedGeometry ? (
                    <Alert
                      type="success"
                      showIcon
                      icon={<CheckOutlined />}
                      message="Zone définie et prête à être sauvegardée"
                      description={formatGeometryDisplay(selectedGeometry)}
                      style={{ marginBottom: 12 }}
                    />
                  ) : (
                    <Alert
                      type={drawingMode === 'drawing' ? 'warning' : 'info'}
                      showIcon
                      icon={<AimOutlined />}
                      message={drawingMode === 'drawing' ? 'Dessin en cours...' : "Zone d'intervention requise"}
                      description={
                        drawingMode === 'drawing'
                          ? `${polygonPoints.length} point(s) défini(s). Minimum 3 points requis.`
                          : "Dessinez un polygone sur la carte pour définir la zone d'intervention"
                      }
                      style={{ marginBottom: 12 }}
                    />
                  )}

                  {/* Contrôles de dessin */}
                  <div style={{ marginBottom: 12 }}>
                    {renderDrawingControls()}
                  </div>

                  {/* Carte */}
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
                      cursor: drawingMode === 'drawing' ? 'crosshair' : 'default'
                    }}
                  />

                  {!mapReady && leafletLoaded && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <Text type="secondary">Initialisation de la carte…</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => navigate('/missions')}>
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  disabled={!canSubmit}
                  loading={submitting}
                  size="large"
                >
                  Créer la mission
                  {selectedGeometry && ` (${polygonPoints.length} points)`}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}