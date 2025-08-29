import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Input, Select, Row, Col,
  Statistic, Alert, Dropdown, Menu
} from 'antd';
import { 
  PlusOutlined, DownOutlined, EnvironmentOutlined, FormOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import { formatDate } from '../../utils';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const statusColor = (s) => ({ PLANIFIEE: 'blue', EN_COURS: 'gold', TERMINEE: 'green' }[s] || 'default');

export default function Missions() {
  const navigate = useNavigate();
  const { user, hasPermission, isAgent, isDSI, isGouverneur } = useAuth();
  const { missions } = useMock();

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);

  const roleFiltered = useMemo(() => {
    if (isAgent()) {
      // Agent d'autorité : missions de sa préfecture uniquement
      return missions.filter((mission) => {
        return mission.prefecture === user.prefecture;
      });
    } else if (isDSI() || isGouverneur()) {
      // DSI et Gouverneur : toutes les missions
      return missions;
    }
    
    return missions;
  }, [missions, user, isAgent, isDSI, isGouverneur]);

  const filtered = roleFiltered.filter((m) => {
    const matchSearch =
      !searchText ||
      m.titre?.toLowerCase().includes(searchText.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !selectedStatus || m.status === selectedStatus;
    const matchCommune = !selectedCommune || m.commune === selectedCommune;
    return matchSearch && matchStatus && matchCommune;
  });

  const stats = {
    total: filtered.length,
    enCours: filtered.filter((m) => m.status === 'EN_COURS').length,
    planifiees: filtered.filter((m) => m.status === 'PLANIFIEE').length,
    terminees: filtered.filter((m) => m.status === 'TERMINEE').length,
  };

  const columns = [
    {
      title: 'Mission',
      dataIndex: 'titre',
      render: (t, r) => (
        <Button type="link" onClick={() => navigate(`/missions/${r.id}`)} style={{ padding: 0 }}>
          {t}
        </Button>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 120,
      render: (s) => <Tag color={statusColor(s)}>{s}</Tag>,
      filters: [
        { text: 'Planifiée', value: 'PLANIFIEE' },
        { text: 'En cours', value: 'EN_COURS' },
        { text: 'Terminée', value: 'TERMINEE' },
      ],
      onFilter: (v, r) => r.status === v,
    },
    { 
      title: 'Commune', 
      dataIndex: 'commune', 
      width: 140 
    },
    { 
      title: 'Préfecture', 
      dataIndex: 'prefecture', 
      width: 200,
      render: (prefecture) => (
        <Text style={{ fontSize: '12px' }}>
          {prefecture?.replace("Préfecture d'arrondissements", "Préf.") || '—'}
        </Text>
      )
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      width: 90 
    },
    { 
      title: 'Date début', 
      dataIndex: 'dateDebut', 
      width: 110, 
      render: (d) => (d ? formatDate(d) : '—') 
    },
    { 
      title: 'Date fin', 
      dataIndex: 'dateFin', 
      width: 110, 
      render: (d) => (d ? formatDate(d) : '—') 
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/missions/${r.id}`)}>
            Détails
          </Button>
          {hasPermission('canCreateMissions') && (
            <Button type="link" size="small">
              Modifier
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const createMissionMenu = (
    <Menu
      items={[
        {
          key: 'form',
          icon: <FormOutlined />,
          label: 'Création standard',
          onClick: () => navigate('/missions/nouveau')
        },
        {
          key: 'map',
          icon: <EnvironmentOutlined />,
          label: 'Depuis la carte',
          onClick: () => navigate('/missions/selecteur-zone')
        }
      ]}
    />
  );

  const availableCommunes = useMemo(() => {
    if (isAgent()) {
      return [...new Set(roleFiltered.map(m => m.commune))].filter(Boolean);
    }
    return [...new Set(missions.map(m => m.commune))].filter(Boolean);
  }, [roleFiltered, missions, isAgent]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Missions de terrain</Title>
          <Text type="secondary">
            {isAgent() 
              ? `Missions de votre préfecture : ${user?.prefecture?.replace("Préfecture d'arrondissements", "Préfecture")}`
              : "Toutes les missions de surveillance"
            }
          </Text>
        </div>

        {hasPermission('canCreateMissions') && (
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/missions/nouveau')}
            >
              Nouvelle mission
            </Button>
            
            <Dropdown overlay={createMissionMenu} trigger={['click']} placement="bottomRight">
              <Button icon={<DownOutlined />} />
            </Dropdown>
          </Space>
        )}
      </div>

      {/* Statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total missions" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Planifiées" 
              value={stats.planifiees} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="En cours" 
              value={stats.enCours} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Terminées" 
              value={stats.terminees} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Search 
              placeholder="Rechercher par titre ou description..." 
              allowClear 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select 
              placeholder="Filtrer par statut" 
              value={selectedStatus} 
              onChange={setSelectedStatus} 
              allowClear 
              style={{ width: '100%' }}
            >
              <Option value="PLANIFIEE">Planifiée</Option>
              <Option value="EN_COURS">En cours</Option>
              <Option value="TERMINEE">Terminée</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select 
              placeholder="Filtrer par commune" 
              value={selectedCommune} 
              onChange={setSelectedCommune} 
              allowClear 
              style={{ width: '100%' }}
            >
              {availableCommunes.map(commune => (
                <Option key={commune} value={commune}>{commune}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tableau des missions */}
      <Card>
        {filtered.length ? (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} missions`,
            }}
            scroll={{ x: 1200 }}
            size="small"
          />
        ) : (
          <Alert 
            type="info" 
            showIcon 
            message="Aucune mission trouvée" 
            description={
              isAgent() 
                ? `Aucune mission dans votre préfecture (${user?.prefecture}) ne correspond aux critères de recherche.`
                : "Aucune mission ne correspond aux critères de recherche."
            }
          />
        )}
      </Card>
    </div>
  );
}