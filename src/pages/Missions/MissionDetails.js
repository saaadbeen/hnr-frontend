import React, { useState, useEffect } from 'react';
import {
  Card, Button, Typography, Space, Tag, Descriptions, List, Avatar,
  Spin, Alert, Modal, Form, Select, notification, Divider, Progress, Statistic, Row, Col
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import mockApiService, { useMock } from '../../services/mockApi';
import { formatDate } from '../../utils';

const { Title, Text } = Typography;
const { Option } = Select;

function polygonCentroid(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const pts = [...ring];
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (last && first && last[0] === first[0] && last[1] === first[1]) {
    pts.pop();
  }
  if (pts.length < 3) return null;

  let area = 0, cx = 0, cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x1, y1] = pts[j];
    const [x2, y2] = pts[i];
    const f = x1 * y2 - x2 * y1;
    area += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const sum = pts.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
    return { lng: sum.x / pts.length, lat: sum.y / pts.length };
  }
  cx /= (6 * area);
  cy /= (6 * area);
  return { lng: cx, lat: cy };
}

function formatGeometry(geometry) {
  if (!geometry) return 'Non spécifiée';
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `Point — ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return 'Point — coordonnées invalides';
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates) && Array.isArray(geometry.coordinates[0])) {
    const ring = geometry.coordinates[0];
    const count =
      ring.length > 1 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring.length - 1
        : ring.length;
    const c = polygonCentroid(ring);
    const centerTxt = c ? ` — centre ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : '';
    return `Polygone (${count} sommets)${centerTxt}`;
  }
  return `${geometry.type || 'Géométrie'} — non gérée`;
}

const statusColor = (s) =>
  ({ PLANIFIEE: 'blue', EN_COURS: 'orange', TERMINEE: 'green', SUSPENDUE: 'red' }[s] || 'default');

export default function MissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, changements, douars } = useMock();

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    const loadMission = async () => {
      try {
        setLoading(true);
        const missionData = await mockApiService.getMissionById(id);
        if (missionData) {
          setMission(missionData);
        } else {
          notification.error({
            message: 'Mission non trouvée',
            description: 'La mission demandée n’existe pas ou a été supprimée',
          });
          navigate('/missions');
        }
      } catch (error) {
        notification.error({
          message: 'Erreur de chargement',
          description: 'Impossible de charger les détails de la mission',
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) loadMission();
  }, [id, navigate]);

  const missionDouars = (douars || []).filter((d) => d.missionId === id);

  const relatedChangements = (changements || []).filter((c) =>
    missionDouars.some((d) => d.id === c.douarId)
  );

  const assignedIds = (mission?.assignedUserIds || mission?.assignedUsers || []);
  const assignedUsers = (users || []).filter((u) => assignedIds.includes(u.id));

  const creatorId = mission?.createdByUserId || mission?.createdBy;
  const creator = (users || []).find((u) => u.id === creatorId);

  const missionStats = {
    totalChangements: relatedChangements.length,
    changementsDetectes: relatedChangements.filter((c) => c.statut === 'DETECTE').length,
    changementsEnTraitement: relatedChangements.filter((c) => c.statut === 'EN_TRAITEMENT').length,
    changementsTraites: relatedChangements.filter((c) => c.statut === 'TRAITE').length,
    surfaceTotale: relatedChangements.reduce((sum, c) => sum + (c.surface || 0), 0),
  };

  const progressPercentage =
    missionStats.totalChangements > 0
      ? Math.round((missionStats.changementsTraites / missionStats.totalChangements) * 100)
      : 0;

  const handleAssignUser = async (values) => {
    try {
      const updated = Array.from(new Set([...assignedIds, values.userId]));
      await mockApiService.updateMission(id, {
        assignedUserIds: updated,
        assignedUsers: updated, 
      });
      setMission((prev) => ({ ...prev, assignedUserIds: updated, assignedUsers: updated }));
      notification.success({ message: 'Utilisateur assigné' });
      setAssignModalVisible(false);
      assignForm.resetFields();
    } catch {
      notification.error({ message: "Erreur d'assignation" });
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      const updated = assignedIds.filter((x) => x !== userId);
      await mockApiService.updateMission(id, {
        assignedUserIds: updated,
        assignedUsers: updated, 
      });
      setMission((prev) => ({ ...prev, assignedUserIds: updated, assignedUsers: updated }));
      notification.success({ message: 'Utilisateur retiré' });
    } catch {
      notification.error({ message: 'Erreur' });
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await mockApiService.updateMission(id, { status: newStatus });
      setMission((prev) => ({ ...prev, status: newStatus }));
      notification.success({ message: 'Statut mis à jour' });
    } catch {
      notification.error({ message: 'Erreur de mise à jour' });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" tip="Chargement des détails de la mission..." />
      </div>
    );
  }

  if (!mission) {
    return <Alert message="Mission non trouvée" type="error" showIcon />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate('/missions')} style={{ marginBottom: 16 }}>
          Retour aux missions
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>{mission.titre}</Title>
            <Text type="secondary">
              {(mission.commune || '—')}, {(mission.prefecture || '—')}
            </Text>
          </div>
          <Space>
            <Tag color={statusColor(mission.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
              {mission.status || '—'}
            </Tag>
            {(user?.role === 'MEMBRE_DSI' || user?.role === 'GOUVERNEUR') && (
              <Button type="primary">Modifier</Button>
            )}
          </Space>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Détails de la mission" style={{ marginBottom: 24 }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Titre" span={2}>{mission.titre}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>{mission.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="Type"><Tag color="blue">{mission.type || 'POLYGON'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Statut"><Tag color={statusColor(mission.status)}>{mission.status || '—'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Date de début">{formatDate(mission.dateDebut)}</Descriptions.Item>
              <Descriptions.Item label="Date de fin">{formatDate(mission.dateFin)}</Descriptions.Item>
              <Descriptions.Item label="Commune">{mission.commune || '—'}</Descriptions.Item>
              <Descriptions.Item label="Préfecture">{mission.prefecture || '—'}</Descriptions.Item>
              <Descriptions.Item label="Géométrie" span={2}>
                {formatGeometry(mission.geometry)}
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">{formatDate(mission.createdAt, 'DD/MM/YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Créé par">
                {creator ? (
                  <Space>
                    <Avatar size="small">{creator.nom?.charAt(0)?.toUpperCase()}</Avatar>
                    <Text>{creator.nom}</Text>
                    <Tag color="geekblue">{creator.role}</Tag>
                  </Space>
                ) : (
                  'Inconnu'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={`Changements détectés (${relatedChangements.length})`}>
            {relatedChangements.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={relatedChangements}
                renderItem={(c) => (
                  <List.Item
                    actions={[
                      <Tag color={c.statut === 'DETECTE' ? 'red' : c.statut === 'EN_TRAITEMENT' ? 'orange' : 'green'}>
                        {c.statut}
                      </Tag>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#ff4d4f' }}>C</Avatar>}
                      title={c.type.replace('_', ' ')}
                      description={
                        <div>
                          <Text>{c.description}</Text><br />
                          <Text type="secondary">Surface: {c.surface} m² • Détecté le {formatDate(c.dateDetection)}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="Aucun changement détecté" type="info" showIcon />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Statistiques" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}><Statistic title="Changements" value={missionStats.totalChangements} /></Col>
              <Col span={12}><Statistic title="Surface totale" value={missionStats.surfaceTotale} suffix="m²" /></Col>
            </Row>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Text strong>Progression du traitement</Text>
              <Progress percent={progressPercentage} status={progressPercentage === 100 ? 'success' : 'active'} style={{ marginTop: 8 }} />
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Détectés:</Text><Tag color="red">{missionStats.changementsDetectes}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>En traitement:</Text><Tag color="orange">{missionStats.changementsEnTraitement}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Traités:</Text><Tag color="green">{missionStats.changementsTraites}</Tag>
              </div>
            </Space>
          </Card>

          {(user?.role === 'MEMBRE_DSI' || user?.role === 'GOUVERNEUR') && (
            <Card title="Équipe assignée" extra={<Button type="link" onClick={() => setAssignModalVisible(true)}>Assigner</Button>}>
              {assignedUsers.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={assignedUsers}
                  renderItem={(u) => (
                    <List.Item
                      actions={[
                        <Button type="link" danger size="small" onClick={() => handleRemoveUser(u.id)}>Retirer</Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar>{u.nom.charAt(0)}</Avatar>}
                        title={u.nom}
                        description={<><Tag color="blue">{u.role}</Tag><br /><Text type="secondary">{u.commune}</Text></>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert message="Aucun agent assigné" type="warning" showIcon />
              )}
            </Card>
          )}

          {(user?.role === 'MEMBRE_DSI' || user?.role === 'GOUVERNEUR') && (
            <Card title="Actions rapides">
              <Space direction="vertical" style={{ width: '100%' }}>
                {mission.status !== 'EN_COURS' && (
                  <Button type="primary" block onClick={() => handleStatusUpdate('EN_COURS')}>Démarrer la mission</Button>
                )}
                {mission.status === 'EN_COURS' && (
                  <Button type="default" block onClick={() => handleStatusUpdate('SUSPENDUE')}>Suspendre la mission</Button>
                )}
                {mission.status !== 'TERMINEE' && (
                  <Button type="primary" block onClick={() => handleStatusUpdate('TERMINEE')}>Marquer comme terminée</Button>
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="Assigner un agent à la mission"
        open={assignModalVisible}
        onCancel={() => { setAssignModalVisible(false); assignForm.resetFields(); }}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignUser}>
          <Form.Item
            name="userId"
            label="Sélectionner un agent"
            rules={[{ required: true, message: 'Veuillez sélectionner un agent' }]}
          >
            <Select placeholder="Choisir un agent d'autorité" showSearch optionFilterProp="children">
              {(users || [])
                .filter((u) => u.role === 'AGENT_AUTORITE' && !assignedUsers.some((a) => a.id === u.id))
                .map((u) => (
                  <Option key={u.id} value={u.id}>{u.nom} - {u.commune}</Option>
                ))}
            </Select>
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAssignModalVisible(false)}>Annuler</Button>
              <Button type="primary" htmlType="submit">Assigner</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
