import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Alert,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  notification,
  Modal,
  Spin,
  Upload
} from 'antd';
import {
  SaveOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PREFECTURES, COMMUNES_BY_PREFECTURE } from '../../services/mockData';
import mockApiService from '../../services/mockApi';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;


const MapLocationSelector = ({ onLocationSelect, initialLocation = null, visible, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedGeometry, setSelectedGeometry] = useState(initialLocation);

  useEffect(() => {
    if (!visible) return;
    const loadLeaflet = async () => {
      if (!window.L) {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement('link');
          leafletCSS.rel = 'stylesheet';
          leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(leafletCSS);
        }
        if (!document.querySelector('script[src*="leaflet.js"]')) {
          const leafletJS = document.createElement('script');
          leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          leafletJS.onload = () => {
            try {
              delete window.L.Icon.Default.prototype._getIconUrl;
              window.L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              });
            } catch {}
            const drawCSS = document.createElement('link');
            drawCSS.rel = 'stylesheet';
            drawCSS.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
            document.head.appendChild(drawCSS);
            const drawScript = document.createElement('script');
            drawScript.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
            drawScript.onload = () => { setMapLoaded(true); };
            document.head.appendChild(drawScript);
          };
          document.head.appendChild(leafletJS);
        }
      } else {
        if (!window.L.Draw) {
          const drawCSS = document.createElement('link');
          drawCSS.rel = 'stylesheet';
          drawCSS.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
          document.head.appendChild(drawCSS);
          const drawScript = document.createElement('script');
          drawScript.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
          drawScript.onload = () => { setMapLoaded(true); };
          document.head.appendChild(drawScript);
        } else {
          setMapLoaded(true);
        }
      }
    };
    loadLeaflet();
  }, [visible]);

  useEffect(() => {
    if (!mapLoaded || !visible || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = window.L.map(mapRef.current, {
      center: initialLocation && initialLocation.type === 'Point'
        ? [initialLocation.coordinates[1], initialLocation.coordinates[0]]
        : [33.6, -7.4],
      zoom: initialLocation ? 15 : 11
    });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const drawnItems = new window.L.FeatureGroup();
    map.addLayer(drawnItems);

    if (initialLocation) {
      if (initialLocation.type === 'Point') {
        const [lng, lat] = initialLocation.coordinates || [initialLocation.lng, initialLocation.lat];
        window.L.marker([lat, lng]).addTo(drawnItems);
      } else {
        window.L.geoJSON(initialLocation).eachLayer(layer => drawnItems.addLayer(layer));
      }
    }

    const drawControl = new window.L.Control.Draw({
      edit: { featureGroup: drawnItems, remove: true },
      draw: {
        polygon: true,
        rectangle: true,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: true
      }
    });
    map.addControl(drawControl);

    const updateSelectedGeometry = () => {
      const features = drawnItems.toGeoJSON().features;
      if (!features.length) {
        setSelectedGeometry(null);
        return;
      }
      if (features.length === 1) {
        setSelectedGeometry(features[0].geometry);
      } else {
        const polygons = features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        if (polygons.length >= 1 && polygons.length === features.length) {
          const multiCoords = [];
          polygons.forEach(f => {
            if (f.geometry.type === 'Polygon') {
              multiCoords.push(f.geometry.coordinates);
            } else if (f.geometry.type === 'MultiPolygon') {
              f.geometry.coordinates.forEach(poly => multiCoords.push(poly));
            }
          });
          setSelectedGeometry({ type: 'MultiPolygon', coordinates: multiCoords });
        } else if (features.length === 1) {
          setSelectedGeometry(features[0].geometry);
        } else {
          setSelectedGeometry({ type: 'FeatureCollection', features });
        }
      }
    };

    map.on(window.L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      if (e.layerType === 'marker') {
        drawnItems.clearLayers();
      } else if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        drawnItems.getLayers().forEach(l => {
          if (l instanceof window.L.Marker) drawnItems.removeLayer(l);
        });
      }
      drawnItems.addLayer(layer);
      updateSelectedGeometry();
    });
    map.on(window.L.Draw.Event.EDITED, () => {
      updateSelectedGeometry();
    });
    map.on(window.L.Draw.Event.DELETED, () => {
      updateSelectedGeometry();
    });

    mapInstanceRef.current = map;
    updateSelectedGeometry();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded, visible, initialLocation]);

  const handleConfirmLocation = () => {
    if (selectedGeometry) {
      onLocationSelect(selectedGeometry);
      onClose();
    } else {
      notification.warning({
        message: 'Aucune zone sélectionnée',
        description: 'Dessinez une zone ou placez un point sur la carte pour sélectionner la localisation'
      });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined />
          Sélectionner la localisation sur la carte
        </Space>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleConfirmLocation}
      width={800}
      okText="Confirmer la localisation"
      cancelText="Annuler"
      okButtonProps={{ disabled: !selectedGeometry }}
    >
      <Alert
        message="Dessinez un polygone ou un rectangle, ou cliquez pour placer un point afin de localiser le changement"
        type="info"
        style={{ marginBottom: 16 }}
      />

      <div
        ref={mapRef}
        style={{ height: '400px', width: '100%', background: '#f0f0f0' }}
      >
        {!mapLoaded && (
          <div
            style={{
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Spin size="large" tip="Chargement de la carte..." />
          </div>
        )}
      </div>

      {selectedGeometry && (
        <Alert
          message={
            selectedGeometry.type === 'Point'
              ? `Position sélectionnée: ${selectedGeometry.coordinates[1].toFixed(6)}, ${selectedGeometry.coordinates[0].toFixed(6)}`
              : selectedGeometry.type === 'Polygon'
                ? `Zone sélectionnée: polygone avec ${selectedGeometry.coordinates[0].length - 1} sommets`
                : selectedGeometry.type === 'MultiPolygon'
                  ? `Zone sélectionnée: ${selectedGeometry.coordinates.length} polygones`
                  : 'Zone sélectionnée'
          }
          type="success"
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};


const ChangementCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [douars, setDouars] = useState([]);
  const [location, setLocation] = useState(null);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const loadDouars = async () => {
      try {
        const douarsData = (await mockApiService.getDouars?.()) || [];
        setDouars(douarsData);
      } catch (error) {
        console.error('Erreur chargement douars:', error);
        notification.error({
          message: 'Erreur',
          description: 'Impossible de charger les douars'
        });
      }
    };
    loadDouars();
  }, []);

  const filteredDouars = useMemo(() => {
    const commune = form.getFieldValue('commune');
    const prefecture = form.getFieldValue('prefecture');
    return douars.filter(d =>
      (!commune || d.commune === commune) &&
      (!prefecture || d.prefecture === prefecture)
    );
  }, [douars, form]);

  const handlePrefectureChange = (prefecture) => {
    form.setFieldsValue({ prefecture, commune: undefined, douarConcerne: undefined });
  };
  const handleCommuneChange = (commune) => {
    form.setFieldsValue({ commune, douarConcerne: undefined });
  };

  const handleLocationSelect = (geometry) => {
    setLocation(geometry);
    if (geometry?.type === 'Point') {
      const [lng, lat] = geometry.coordinates;
      notification.success({
        message: 'Localisation enregistrée',
        description: `Position: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } else {
      notification.success({
        message: 'Localisation enregistrée',
        description: 'Zone de changement sélectionnée sur la carte'
      });
    }
  };

  const uploadProps = {
    name: 'rapport',
    accept: '.pdf',
    listType: 'text',
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPDF) {
        notification.error({
          message: 'Format non supporté',
          description: 'Veuillez sélectionner un fichier PDF (.pdf)'
        });
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        notification.error({
          message: 'Fichier trop volumineux',
          description: 'Le fichier ne doit pas dépasser 10 MB'
        });
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList: fl }) => {
      setFileList(fl.slice(-1));
      const f = fl[0]?.originFileObj || null;
      setUploadedFile(f || null);
    },
    onRemove: () => {
      setUploadedFile(null);
      setFileList([]);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        titre: values.titre,
        type: values.type,
        description: values.description,
        commune: values.commune,
        prefecture: values.prefecture,
        statut: 'DETECTE',
        detectedByUserId: user?.id,
        douarId: values.douarConcerne || null,
        geometry: location || null,
        dateDetection: new Date().toISOString(),
        adressePrecise: values.adressePrecise || '',
        rapportPDF: uploadedFile
          ? {
              name: uploadedFile.name,
              size: uploadedFile.size,
              type: uploadedFile.type || 'application/pdf',
              lastModified: uploadedFile.lastModified,
              url: URL.createObjectURL(uploadedFile)
            }
          : null
      };

      await mockApiService.createChangement(payload);

      notification.success({
        message: 'Changement déclaré',
        description: uploadedFile
          ? 'Le changement et son rapport PDF ont été enregistrés.'
          : 'Le changement a été enregistré (sans PDF).'
      });

      navigate('/changements');
    } catch (error) {
      console.error('Erreur création changement:', error);
      notification.error({
        message: 'Erreur',
        description: 'Impossible de créer le changement'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/changements')}
          style={{ marginBottom: 16 }}
        >
          Retour à la liste
        </Button>

        <Title level={2}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          Déclarer un nouveau changement
        </Title>
        <Text type="secondary">
          Signalez un changement détecté et rattachez-le au douar concerné.
        </Text>
      </div>

      {/* Formulaire unique */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          titre: '',
          type: undefined,
          description: '',
          commune: '',
          prefecture: '',
          douarConcerne: '',
          adressePrecise: ''
        }}
      >
        <Row gutter={24}>
          {/* Col gauche : infos + localisation */}
          <Col span={16}>
            <Card title="Informations générales">
              {/* Titre */}
              <Form.Item
                name="titre"
                label="Titre du changement"
                rules={[
                  { required: true, message: 'Le titre est obligatoire' },
                  { min: 10, message: 'Le titre doit contenir au moins 10 caractères' },
                  { max: 100, message: 'Le titre ne peut pas dépasser 100 caractères' }
                ]}
              >
                <Input
                  placeholder="Ex: Construction non autorisée dans le douar XXX"
                  showCount
                  maxLength={100}
                />
              </Form.Item>

              {/* Type de changement */}
              <Form.Item
                name="type"
                label="Type de changement"
                rules={[{ required: true, message: 'Le type de changement est obligatoire' }]}
              >
                <Select placeholder="Sélectionner le type">
                  <Option value="EXTENSION_HORIZONTALE">Extension horizontale</Option>
                  <Option value="EXTENSION_VERTICALE">Extension verticale</Option>
                  <Option value="CONSTRUCTION_NOUVELLE">Construction nouvelle</Option>
                </Select>
              </Form.Item>

              {/* Description */}
              <Form.Item
                name="description"
                label="Description détaillée"
                rules={[
                  { required: true, message: 'La description est obligatoire' },
                  { min: 20, message: 'La description doit contenir au moins 20 caractères' },
                  { max: 500, message: 'La description ne peut pas dépasser 500 caractères' }
                ]}
              >
                <TextArea
                  placeholder="Décrivez précisément le changement observé : nature des travaux, état d'avancement, impact, etc."
                  rows={4}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Divider />

              {/* Localisation */}
              <Title level={4}>Localisation</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="prefecture"
                    label="Préfecture"
                    rules={[{ required: true, message: 'La préfecture est obligatoire' }]}
                  >
                    <Select
                      placeholder="Sélectionner la préfecture"
                      onChange={handlePrefectureChange}
                    >
                      {PREFECTURES.map(pref => (
                        <Option key={pref} value={pref}>{pref}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="commune"
                    label="Commune"
                    rules={[{ required: true, message: 'La commune est obligatoire' }]}
                  >
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.prefecture !== curr.prefecture}>
                      {({ getFieldValue }) => {
                        const prefecture = getFieldValue('prefecture');
                        return (
                          <Select
                            placeholder="Sélectionner la commune"
                            onChange={handleCommuneChange}
                            disabled={!prefecture}
                          >
                            {prefecture && COMMUNES_BY_PREFECTURE[prefecture]?.map(commune => (
                              <Option key={commune} value={commune}>{commune}</Option>
                            ))}
                          </Select>
                        );
                      }}
                    </Form.Item>
                  </Form.Item>
                </Col>
              </Row>

              {/* Douar */}
              <Form.Item
                name="douarConcerne"
                label="Douar concerné"
                rules={[{ required: true, message: 'Le douar concerné est obligatoire' }]}
              >
                <Select
                  placeholder="Sélectionner le douar"
                  disabled={!form.getFieldValue('commune')}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {filteredDouars.map(d => (
                    <Option key={d.id} value={d.id}>
                      {d.nom} ({d.commune})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Adresse précise */}
              <Form.Item name="adressePrecise" label="Adresse précise (optionnel)">
                <Input placeholder="Ex: point repère/localisation textuelle" />
              </Form.Item>

              {/* Sélecteur carte */}
              <div style={{ marginBottom: 24 }}>
                <Space>
                  <Button
                    icon={<EnvironmentOutlined />}
                    onClick={() => setMapSelectorVisible(true)}
                    type={location ? 'primary' : 'default'}
                  >
                    {location
                      ? (location.type === 'Point' ? 'Position sélectionnée' : 'Zone sélectionnée')
                      : 'Sélectionner sur la carte'}
                  </Button>
                  {location && (
                    <Text type="secondary">
                      {location.type === 'Point'
                        ? `${location.coordinates[1].toFixed(6)}, ${location.coordinates[0].toFixed(6)}`
                        : location.type === 'Polygon'
                          ? `Polygone défini (${location.coordinates[0].length - 1} sommets)`
                          : location.type === 'MultiPolygon'
                            ? `${location.coordinates.length} polygones définis`
                            : ''}
                    </Text>
                  )}
                </Space>
              </div>

              <Divider />

              {/* Actions */}
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => navigate('/changements')}>
                    Annuler
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    Déclarer le changement
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Col droite : Agent + PDF + Aide */}
          <Col span={8}>
            <Card title="Agent" style={{ marginBottom: 16 }}>
              <Space direction="vertical">
                <div>
                  <Text strong>{user.nom}</Text>
                </div>
                <div>
                  <Text type="secondary">{user.commune}, {user.prefecture}</Text>
                </div>
              </Space>
            </Card>

            <Card title="Documentation (PDF)" style={{ marginBottom: 16 }}>
              <Alert
                message="Joindre un rapport PDF existant (optionnel)"
                description="Le fichier sera attaché au changement (mock)."
                type="info"
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="Rapport PDF (optionnel)">
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Sélectionner un PDF</Button>
                </Upload>
              </Form.Item>
              {uploadedFile && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Fichier sélectionné : <strong>{uploadedFile.name}</strong>
                </Text>
              )}
            </Card>

            <Card title="Aide">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>Extension horizontale:</strong> Ajout de pièces au niveau du sol
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>Extension verticale:</strong> Construction d'étages supplémentaires
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>Construction nouvelle:</strong> Nouveau bâtiment sur terrain vague
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Modal sélecteur de carte */}
        <MapLocationSelector
          visible={mapSelectorVisible}
          onClose={() => setMapSelectorVisible(false)}
          onLocationSelect={handleLocationSelect}
          initialLocation={location}
        />
      </Form>
    </div>
  );
};

export default ChangementCreate;
