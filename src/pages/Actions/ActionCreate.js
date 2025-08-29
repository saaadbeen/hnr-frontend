import React, { useEffect, useMemo, useState } from 'react';
import {
  Layout, Card, Button, Space, Typography, Form,
  Input, Select, Row, Col, notification, DatePicker, Alert
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, FileTextOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import mockData from '../../services/mockData';
import mockApi from '../../services/mockApi';
import { ACTION_TYPES } from '../../utils/actionHelpers';
import { getCommuneCoordinates, formatCoordinates } from '../../utils/geolocationHelpers';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

export default function ActionCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { missions: apiMissions, loading } = useMock();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const missions = useMemo(
    () => (apiMissions?.length ? apiMissions : mockData.missions || []),
    [apiMissions]
  );

  const visibleMissions = useMemo(() => {
    if (user?.role === 'AGENT_AUTORITE') {
      return missions.filter(
        (m) => m.prefecture === user.prefecture
      );
    }
    return missions;
  }, [missions, user]);

  const [selectedMission, setSelectedMission] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  const onMissionChange = (missionId) => {
    const m = visibleMissions.find((x) => x.id === missionId);
    setSelectedMission(m || null);
    if (m) {
      form.setFieldsValue({
        prefecture: m.prefecture,
        commune: m.commune,
      });
      setShowLocationInfo(true);
    } else {
      setShowLocationInfo(false);
    }
  };

  useEffect(() => {
    if (user) {
      const communeCoords = getCommuneCoordinates(user.commune);
      
      form.setFieldsValue({
        date: dayjs(),
        prefecture: user.prefecture || "Préfecture d'arrondissements de Casablanca-Anfa",
        commune: user.commune || 'Anfa',
        ...(communeCoords && {
          latitude: communeCoords.lat,
          longitude: communeCoords.lng
        })
      });
    }
  }, [user, form]);

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);

      if (!selectedMission) {
        notification.error({
          message: 'Mission requise',
          description: 'Veuillez sélectionner une mission pour créer cette action.'
        });
        return;
      }

      const now = new Date();

      const createdAction = await mockApi.createAction({
        type: values.type,
        date: values.date ? values.date.toDate() : now,
        observations: values.observations || '',
        commune: selectedMission.commune,
        prefecture: selectedMission.prefecture,
        missionId: selectedMission.id,
        userId: user.id,
        user: { id: user.id, name: user.nom, email: user.email },
        geometry: selectedMission.geometry || selectedMission.center, // Utiliser la géométrie de la mission
        status: 'EN_COURS',
        createdAt: now.toISOString(),
        missionMetadata: {
          missionTitle: selectedMission.titre,
          missionType: selectedMission.type,
          assignedFrom: 'mission',
          sourceGeometry: selectedMission.geometry?.type || 'unknown',
          officialCoordinates: true
        }
      });

      notification.success({
        message: 'Action créée avec succès',
        description: `Un PV brouillon a été généré automatiquement pour "${ACTION_TYPES[values.type]?.label || values.type}" avec les coordonnées officielles de ${selectedMission.commune}.`
      });

      if (createdAction?.pvId) {
        navigate(`/actions/pv/${createdAction.pvId}`);
      } else {
        navigate('/actions');
      }
    } catch (e) {
      notification.error({
        message: 'Erreur lors de la création',
        description: e.message || 'Impossible de créer l\'action.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderLocationInfo = () => {
    if (!selectedMission) return null;

    const { geometry, center } = selectedMission;
    const geoData = geometry || center;
    const communeCoords = getCommuneCoordinates(selectedMission.commune);
    
    if (!geoData && !communeCoords) return null;

    let locationDescription = '';
    let coordinates = null;

    if (geoData && geoData.type === 'Point') {
      const [lng, lat] = geoData.coordinates;
      coordinates = { lat, lng };
      locationDescription = `Point précis - ${formatCoordinates(lat, lng)}`;
    } else if (geoData && geoData.type === 'Polygon') {
      const coords = geoData.coordinates[0];
      const pointCount = coords.length - 1;
      locationDescription = `Zone polygonale - ${pointCount} sommets délimitant la zone d'intervention`;
    } else if (communeCoords) {
      coordinates = communeCoords;
      locationDescription = `Centre officiel de ${selectedMission.commune} - ${formatCoordinates(communeCoords.lat, communeCoords.lng)}`;
    }

    return (
      <Alert
        message="Localisation héritée de la mission"
        description={
          <div>
            <Text strong>{selectedMission.titre}</Text>
            <br />
            <Text type="secondary">{locationDescription}</Text>
            {coordinates && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Coordonnées officielles vérifiées : {formatCoordinates(coordinates.lat, coordinates.lng, 'decimal')}
                </Text>
              </>
            )}
          </div>
        }
        type="info"
        showIcon
        icon={<EnvironmentOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  };

  // Affichage des informations de zone pour l'agent d'autorité
  const renderAgentZoneInfo = () => {
    if (user?.role !== 'AGENT_AUTORITE' || !user.commune) return null;

    const communeCoords = getCommuneCoordinates(user.commune);
    if (!communeCoords) return null;

    return (
      <Alert
        message={`Votre zone de métier : ${user.commune}`}
        description={
          <div>
            <Text type="secondary">
              Préfecture : {user.prefecture?.replace("Préfecture d'arrondissements", "Préf.")}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Centre officiel : {formatCoordinates(communeCoords.lat, communeCoords.lng)}
            </Text>
          </div>
        }
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/actions')}
          style={{ marginBottom: 16 }}
        >
          Retour à la liste des actions
        </Button>

        <Card>
          <Title level={3} style={{ marginTop: 0 }}>
            <FileTextOutlined /> Nouvelle action depuis mission
          </Title>
          <Text type="secondary">
            Création d'une action liée à une mission existante. La géolocalisation sera héritée de la mission sélectionnée avec les coordonnées officielles vérifiées.
          </Text>

          {renderAgentZoneInfo()}

          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ date: dayjs() }}
            style={{ marginTop: 24 }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="type"
                  label="Type d'action"
                  rules={[{ required: true, message: 'Le type d\'action est requis' }]}
                >
                  <Select placeholder="Sélectionner un type d'intervention">
                    {Object.entries(ACTION_TYPES).map(([k, cfg]) => (
                      <Option key={k} value={k}>
                        <div>
                          <strong>{cfg.label}</strong>
                          {cfg.description && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                              {cfg.description}
                            </div>
                          )}
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="date"
                  label="Date d'intervention"
                  rules={[{ required: true, message: 'La date est requise' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Sélectionner la date et heure"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="missionId"
              label={user?.role === 'AGENT_AUTORITE' ? 
                `Missions disponibles dans votre préfecture (${visibleMissions.length})` : 
                "Mission associée"
              }
              rules={[{ required: true, message: 'Vous devez sélectionner une mission' }]}
              extra={user?.role === 'AGENT_AUTORITE' ? 
                "Seules les missions de votre préfecture sont affichées" :
                "L'action sera géolocalisée selon la zone définie dans la mission sélectionnée"
              }
            >
              <Select
                placeholder={visibleMissions.length > 0 ? "Sélectionner une mission active" : "Aucune mission disponible"}
                loading={loading}
                onChange={onMissionChange}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                disabled={visibleMissions.length === 0}
              >
                {visibleMissions.map((m) => {
                  const communeCoords = getCommuneCoordinates(m.commune);
                  return (
                    <Option key={m.id} value={m.id}>
                      <div>
                        <Text strong>{m.titre}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {m.commune} • {m.status || '—'} • 
                          {communeCoords ? ' Coordonnées officielles' : ' Géolocalisation définie'}
                        </Text>
                        {communeCoords && (
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {formatCoordinates(communeCoords.lat, communeCoords.lng, 'short')}
                          </Text>
                        )}
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            {visibleMissions.length === 0 && user?.role === 'AGENT_AUTORITE' && (
              <Alert
                type="warning"
                message="Aucune mission disponible"
                description={`Aucune mission n'est actuellement disponible pour votre préfecture (${user.prefecture}). Contactez votre coordinateur DSI pour la création de nouvelles missions.`}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {showLocationInfo && renderLocationInfo()}

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item 
                  name="prefecture" 
                  label="Préfecture"
                  rules={[{ required: true }]}
                >
                  <Input disabled placeholder="Auto-rempli depuis la mission" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item 
                  name="commune" 
                  label="Commune/Arrondissement"
                  rules={[{ required: true }]}
                >
                  <Input disabled placeholder="Auto-rempli depuis la mission" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="observations"
              label="Observations et détails de l'intervention"
              extra="Décrivez les constatations, les actions entreprises, et tout élément pertinent"
            >
              <Input.TextArea
                rows={4}
                placeholder="Décrivez les détails de votre intervention, les constatations, les actions entreprises..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Alert
              message="Géolocalisation automatique avec coordonnées officielles"
              description={selectedMission ? 
                `Cette action utilisera la géolocalisation définie dans la mission "${selectedMission.titre}" avec les coordonnées officielles vérifiées de ${selectedMission.commune}. Aucune saisie manuelle de coordonnées n'est nécessaire.` :
                "Sélectionnez une mission pour hériter automatiquement de sa géolocalisation basée sur les coordonnées officielles."
              }
              type="info"
              showIcon
              icon={<EnvironmentOutlined />}
              style={{ marginBottom: 24 }}
            />

            <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Space>
                <Button onClick={() => navigate('/actions')}>
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  disabled={!selectedMission || visibleMissions.length === 0}
                  size="large"
                >
                  {submitting ? 'Création en cours...' : 'Enregistrer l\'action'}
                  {selectedMission && (
                    <span style={{ marginLeft: 4, opacity: 0.8 }}>
                      ({selectedMission.geometry?.type || 'géolocalisée'})
                    </span>
                  )}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}