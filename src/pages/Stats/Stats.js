import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Select, 
  DatePicker, 
  Space,
  Spin,
  Alert,
  Table,
  Progress,
  Tag,
  Button
} from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import { formatDate, formatNumber } from '../../utils';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Stats() {
  const { user } = useAuth();
  const { missions, changements, users, loading } = useMock();
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [filteredData, setFilteredData] = useState({
    missions: [],
    changements: [],
    users: []
  });

  // Filtrer les données selon les critères sélectionnés et les permissions
  useEffect(() => {
    let filteredMissions = [...missions];
    let filteredChangements = [...changements];
    let filteredUsers = [...users];

    // Filtrage par rôle utilisateur
    if (user?.role === 'AGENT_AUTORITE') {
      filteredMissions = filteredMissions.filter(m => 
        m.commune === user.commune && m.prefecture === user.prefecture
      );
      filteredChangements = filteredChangements.filter(c => 
        c.commune === user.commune && c.prefecture === user.prefecture
      );
      filteredUsers = filteredUsers.filter(u => 
        u.commune === user.commune && u.prefecture === user.prefecture
      );
    }

    // Filtrage par commune sélectionnée
    if (selectedCommune) {
      filteredMissions = filteredMissions.filter(m => m.commune === selectedCommune);
      filteredChangements = filteredChangements.filter(c => c.commune === selectedCommune);
      filteredUsers = filteredUsers.filter(u => u.commune === selectedCommune);
    }

    // Filtrage par période
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filteredMissions = filteredMissions.filter(m => {
        const missionDate = new Date(m.createdAt);
        return missionDate >= startDate && missionDate <= endDate;
      });
      filteredChangements = filteredChangements.filter(c => {
        const changementDate = new Date(c.dateDetection);
        return changementDate >= startDate && changementDate <= endDate;
      });
    }

    setFilteredData({
      missions: filteredMissions,
      changements: filteredChangements,
      users: filteredUsers
    });
  }, [missions, changements, users, selectedCommune, dateRange, user]);

  // Calcul des statistiques principales
  const mainStats = {
    totalMissions: filteredData.missions.length,
    missionsEnCours: filteredData.missions.filter(m => m.status === 'EN_COURS').length,
    missionsTerminees: filteredData.missions.filter(m => m.status === 'TERMINEE').length,
    totalChangements: filteredData.changements.length,
    changementsDetectes: filteredData.changements.filter(c => c.statut === 'DETECTE').length,
    changementsEnTraitement: filteredData.changements.filter(c => c.statut === 'EN_TRAITEMENT').length,
    changementsTraites: filteredData.changements.filter(c => c.statut === 'TRAITE').length,
    surfaceTotale: filteredData.changements.reduce((sum, c) => sum + (c.surface || 0), 0),
    totalAgents: filteredData.users.filter(u => u.role === 'AGENT_AUTORITE').length
  };

  // Taux de traitement
  const tauxTraitement = mainStats.totalChangements > 0 
    ? Math.round((mainStats.changementsTraites / mainStats.totalChangements) * 100)
    : 0;

  // Statistiques par commune
  const statsParCommune = React.useMemo(() => {
    const communesUniques = [...new Set(filteredData.changements.map(c => c.commune))];
    
    return communesUniques.map(commune => {
      const changementsCommune = filteredData.changements.filter(c => c.commune === commune);
      const missionsCommune = filteredData.missions.filter(m => m.commune === commune);
      const agentsCommune = filteredData.users.filter(u => u.commune === commune && u.role === 'AGENT_AUTORITE');
      
      return {
        commune,
        totalChangements: changementsCommune.length,
        changementsDetectes: changementsCommune.filter(c => c.statut === 'DETECTE').length,
        changementsTraites: changementsCommune.filter(c => c.statut === 'TRAITE').length,
        surfaceTotale: changementsCommune.reduce((sum, c) => sum + (c.surface || 0), 0),
        totalMissions: missionsCommune.length,
        missionsActives: missionsCommune.filter(m => m.status === 'EN_COURS').length,
        nombreAgents: agentsCommune.length,
        tauxTraitement: changementsCommune.length > 0 
          ? Math.round((changementsCommune.filter(c => c.statut === 'TRAITE').length / changementsCommune.length) * 100)
          : 0
      };
    }).sort((a, b) => b.totalChangements - a.totalChangements);
  }, [filteredData]);

  // Statistiques par type de changement
  const statsParType = React.useMemo(() => {
    const types = ['EXTENSION_HORIZONTALE', 'EXTENSION_VERTICALE', 'CONSTRUCTION_NOUVELLE'];
    
    return types.map(type => {
      const changementsType = filteredData.changements.filter(c => c.type === type);
      return {
        type: type.replace('_', ' '),
        total: changementsType.length,
        detectes: changementsType.filter(c => c.statut === 'DETECTE').length,
        enTraitement: changementsType.filter(c => c.statut === 'EN_TRAITEMENT').length,
        traites: changementsType.filter(c => c.statut === 'TRAITE').length,
        surfaceMoyenne: changementsType.length > 0 
          ? Math.round(changementsType.reduce((sum, c) => sum + (c.surface || 0), 0) / changementsType.length)
          : 0
      };
    }).filter(stat => stat.total > 0);
  }, [filteredData]);

  // Colonnes pour le tableau des communes
  const colonnesCommunes = [
    {
      title: 'Commune',
      dataIndex: 'commune',
      key: 'commune',
      render: (commune) => <Text strong>{commune}</Text>
    },
    {
      title: 'Changements',
      dataIndex: 'totalChangements',
      key: 'totalChangements',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Surface (m²)',
      dataIndex: 'surfaceTotale',
      key: 'surfaceTotale',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Missions',
      dataIndex: 'totalMissions',
      key: 'totalMissions',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Agents',
      dataIndex: 'nombreAgents',
      key: 'nombreAgents',
      render: (value) => formatNumber(value)
    },
    {
      title: 'Taux de traitement',
      dataIndex: 'tauxTraitement',
      key: 'tauxTraitement',
      render: (value) => (
        <Progress 
          percent={value} 
          size="small" 
          status={value >= 80 ? 'success' : value >= 50 ? 'active' : 'exception'}
        />
      )
    }
  ];

  // Colonnes pour le tableau des types
  const colonnesTypes = [
    {
      title: 'Type de changement',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Text strong>{type}</Text>
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value) => <Text>{formatNumber(value)}</Text>
    },
    {
      title: 'Détectés',
      dataIndex: 'detectes',
      key: 'detectes',
      render: (value) => <Tag color="red">{formatNumber(value)}</Tag>
    },
    {
      title: 'En traitement',
      dataIndex: 'enTraitement',
      key: 'enTraitement',
      render: (value) => <Tag color="orange">{formatNumber(value)}</Tag>
    },
    {
      title: 'Traités',
      dataIndex: 'traites',
      key: 'traites',
      render: (value) => <Tag color="green">{formatNumber(value)}</Tag>
    },
    {
      title: 'Surface moyenne (m²)',
      dataIndex: 'surfaceMoyenne',
      key: 'surfaceMoyenne',
      render: (value) => formatNumber(value)
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Chargement des statistiques..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Statistiques des habitats non réglementaires</Title>
        <Text type="secondary">
          {user?.role === 'AGENT_AUTORITE' 
            ? `Données de ${user.commune}` 
            : 'Vue d\'ensemble des données de la préfecture Casablanca-Settat'
          }
        </Text>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div>
              <Text strong>Commune :</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Toutes les communes"
                allowClear
                value={selectedCommune}
                onChange={setSelectedCommune}
                disabled={user?.role === 'AGENT_AUTORITE'}
              >
                <Option value="Casablanca">Casablanca</Option>
                <Option value="Mohammedia">Mohammedia</Option>
                <Option value="Nouaceur">Nouaceur</Option>
                <Option value="Mediouna">Mediouna</Option>
                <Option value="Bouskoura">Bouskoura</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text strong>Période :</Text>
              <RangePicker
                style={{ width: '100%', marginTop: '8px' }}
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Button 
              type="primary" 
              style={{ marginTop: '28px' }}
              disabled={user?.role === 'AGENT_AUTORITE'}
            >
              Exporter
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistiques principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Missions"
              value={mainStats.totalMissions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Missions en cours"
              value={mainStats.missionsEnCours}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Changements détectés"
              value={mainStats.totalChangements}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Surface totale (m²)"
              value={formatNumber(mainStats.surfaceTotale)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Taux de traitement et répartition */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Taux de traitement global">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={tauxTraitement}
                size={120}
                status={tauxTraitement >= 80 ? 'success' : tauxTraitement >= 50 ? 'active' : 'exception'}
              />
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary">
                  {mainStats.changementsTraites} traités sur {mainStats.totalChangements} détectés
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Répartition des statuts">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text>Détectés</Text>
                </Space>
                <Text strong>{formatNumber(mainStats.changementsDetectes)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text>En traitement</Text>
                </Space>
                <Text strong>{formatNumber(mainStats.changementsEnTraitement)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text>Traités</Text>
                </Space>
                <Text strong>{formatNumber(mainStats.changementsTraites)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Text>Agents actifs</Text>
                </Space>
                <Text strong>{formatNumber(mainStats.totalAgents)}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tableau des statistiques par commune */}
      {user?.role !== 'AGENT_AUTORITE' && (
        <Card title="Statistiques par commune" style={{ marginBottom: '24px' }}>
          <Table
            columns={colonnesCommunes}
            dataSource={statsParCommune}
            rowKey="commune"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Tableau des statistiques par type */}
      <Card title="Statistiques par type de changement">
        <Table
          columns={colonnesTypes}
          dataSource={statsParType}
          rowKey="type"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Alerte si aucune donnée */}
      {mainStats.totalChangements === 0 && (
        <Alert
          style={{ marginTop: '24px' }}
          message="Aucune donnée disponible"
          description="Aucun changement d'habitat n'a été détecté pour les critères sélectionnés"
          type="info"
          showIcon
        />
      )}
    </div>
  );
}