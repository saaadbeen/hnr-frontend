import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  List, 
  Avatar,
  Space,
  Tag,
  Progress,
  Alert,
  Button,
  Spin
} from 'antd';
import { 
  EnvironmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import { formatDate, getRelativeTime } from '../../utils';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { missions, changements, users, loading } = useMock();
  const [filteredData, setFilteredData] = useState({
    missions: [],
    changements: [],
    users: []
  });

  useEffect(() => {
    let filteredMissions = [...missions];
    let filteredChangements = [...changements];
    let filteredUsers = [...users];

    if (user?.role === 'AGENT_AUTORITE') {
      filteredMissions = missions.filter(m => 
        m.commune === user.commune && m.prefecture === user.prefecture
      );
      filteredChangements = changements.filter(c => 
        c.commune === user.commune && c.prefecture === user.prefecture
      );
      filteredUsers = users.filter(u => 
        u.commune === user.commune && u.prefecture === user.prefecture
      );
    }

    setFilteredData({
      missions: filteredMissions,
      changements: filteredChangements,
      users: filteredUsers
    });
  }, [missions, changements, users, user]);

  const stats = {
    totalMissions: filteredData.missions.length,
    missionsEnCours: filteredData.missions.filter(m => m.status === 'EN_COURS').length,
    missionsTerminees: filteredData.missions.filter(m => m.status === 'TERMINEE').length,
    totalChangements: filteredData.changements.length,
    changementsDetectes: filteredData.changements.filter(c => c.statut === 'DETECTE').length,
    changementsEnTraitement: filteredData.changements.filter(c => c.statut === 'EN_TRAITEMENT').length,
    changementsTraites: filteredData.changements.filter(c => c.statut === 'TRAITE').length,
    totalAgents: filteredData.users.filter(u => u.role === 'AGENT_AUTORITE').length,
    surfaceTotale: filteredData.changements.reduce((sum, c) => sum + (c.surface || 0), 0)
  };

  const tauxTraitement = stats.totalChangements > 0 
    ? Math.round((stats.changementsTraites / stats.totalChangements) * 100)
    : 0;

  const missionsRecentes = filteredData.missions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const changementsRecents = filteredData.changements
    .sort((a, b) => new Date(b.dateDetection) - new Date(a.dateDetection))
    .slice(0, 5);

  const getStatusColor = (status, type = 'mission') => {
    if (type === 'mission') {
      switch (status) {
        case 'PLANIFIEE': return 'blue';
        case 'EN_COURS': return 'orange';
        case 'TERMINEE': return 'green';
        default: return 'default';
      }
    } else {
      switch (status) {
        case 'DETECTE': return 'red';
        case 'EN_TRAITEMENT': return 'orange';
        case 'TRAITE': return 'green';
        default: return 'default';
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          Tableau de bord
          {user?.role === 'AGENT_AUTORITE' && (
            <Text type="secondary" style={{ fontSize: '16px', marginLeft: '16px' }}>
              • {user.commune}
            </Text>
          )}
        </Title>
        <Text type="secondary">
          Vue d'ensemble de la surveillance des habitats non réglementaires
        </Text>
      </div>

      {/* Message de bienvenue personnalisé */}
      <Alert
        message={`Bienvenue ${user?.nom}`}
        description={
          user?.role === 'AGENT_AUTORITE' 
            ? `Vous supervisez la zone de ${user.commune}. Consultez vos missions actives et les changements détectés dans votre secteur.`
            : `Accédez aux données de toute la préfecture Casablanca-Settat et gérez les opérations de surveillance.`
        }
        type="info"
        showIcon
        closable
        style={{ marginBottom: '24px' }}
      />

      {/* Statistiques principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Missions actives"
              value={stats.missionsEnCours}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={`/ ${stats.totalMissions}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Changements détectés"
              value={stats.changementsDetectes}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Surface totale (m²)"
              value={stats.surfaceTotale}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Taux de traitement"
              value={tauxTraitement}
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: tauxTraitement >= 80 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progression et actions rapides */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Progression du traitement">
            <div style={{ marginBottom: '16px' }}>
              <Progress 
                percent={tauxTraitement} 
                size="default"
                status={tauxTraitement >= 80 ? 'success' : tauxTraitement >= 50 ? 'active' : 'exception'}
              />
            </div>
            <Row gutter={[16, 16]}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div>
                  <Text type="secondary">Détectés</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {stats.changementsDetectes}
                  </div>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div>
                  <Text type="secondary">En traitement</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                    {stats.changementsEnTraitement}
                  </div>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div>
                  <Text type="secondary">Traités</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.changementsTraites}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Actions rapides">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button 
                type="primary" 
                icon={<EyeOutlined />} 
                block
                onClick={() => navigate('/carte')}
              >
                Voir la carte interactive
              </Button>
              
              {hasPermission('canCreateMissions') && (
                <Button 
                  icon={<PlusOutlined />} 
                  block
                  onClick={() => navigate('/missions/nouvelle')}
                >
                  Créer une nouvelle mission
                </Button>
              )}
              
              {hasPermission('canCreateActions') && (
                <Button 
                  icon={<PlusOutlined />} 
                  block
                  onClick={() => navigate('/actions/nouvelle')}
                >
                  Enregistrer une action
                </Button>
              )}
              
              {hasPermission('canViewStats') && (
                <Button 
                  icon={<TrophyOutlined />} 
                  block
                  onClick={() => navigate('/stats')}
                >
                  Consulter les statistiques
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Listes des activités récentes */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Missions récentes" 
            extra={
              <Button type="link" onClick={() => navigate('/missions')}>
                Voir toutes
              </Button>
            }
          >
            {missionsRecentes.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={missionsRecentes}
                renderItem={(mission) => (
                  <List.Item
                    actions={[
                      <Tag color={getStatusColor(mission.status)}>
                        {mission.status}
                      </Tag>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<EnvironmentOutlined />} 
                          style={{ backgroundColor: getStatusColor(mission.status) === 'green' ? '#52c41a' : '#1890ff' }}
                        />
                      }
                      title={
                        <Button 
                          type="link" 
                          style={{ padding: 0, height: 'auto' }}
                          onClick={() => navigate(`/missions/${mission.id}`)}
                        >
                          {mission.titre}
                        </Button>
                      }
                      description={
                        <div>
                          <Text type="secondary">{mission.commune}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {getRelativeTime(mission.createdAt)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Aucune mission récente</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Changements récents"
            extra={
              hasPermission('canCreateActions') && (
                <Button type="link" onClick={() => navigate('/actions')}>
                  Voir tous
                </Button>
              )
            }
          >
            {changementsRecents.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={changementsRecents}
                renderItem={(changement) => (
                  <List.Item
                    actions={[
                      <Tag color={getStatusColor(changement.statut, 'changement')}>
                        {changement.statut}
                      </Tag>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<WarningOutlined />} 
                          style={{ backgroundColor: getStatusColor(changement.statut, 'changement') === 'red' ? '#ff4d4f' : '#1890ff' }}
                        />
                      }
                      title={changement.type.replace('_', ' ')}
                      description={
                        <div>
                          <Text type="secondary">{changement.commune} • {changement.surface} m²</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {getRelativeTime(changement.dateDetection)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Aucun changement récent</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Informations de l'équipe (seulement pour DSI et Gouverneur) */}
      {hasPermission('canViewStats') && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card title="Équipe active">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Total agents"
                    value={stats.totalAgents}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Missions terminées"
                    value={stats.missionsTerminees}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Missions en cours"
                    value={stats.missionsEnCours}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Total missions"
                    value={stats.totalMissions}
                    prefix={<EnvironmentOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Message si aucune donnée */}
      {stats.totalMissions === 0 && stats.totalChangements === 0 && (
        <Alert
          style={{ marginTop: '24px' }}
          message="Aucune activité détectée"
          description={
            user?.role === 'AGENT_AUTORITE' 
              ? `Aucune mission ou changement n'a été enregistré pour votre zone (${user.commune}).`
              : "Aucune mission ou changement n'a été enregistré dans le système."
          }
          type="info"
          showIcon
          action={
            hasPermission('canCreateMissions') && (
              <Button 
                type="primary" 
                size="small"
                onClick={() => navigate('/missions/nouvelle')}
              >
                Créer une mission
              </Button>
            )
          }
        />
      )}
    </div>
  );
}