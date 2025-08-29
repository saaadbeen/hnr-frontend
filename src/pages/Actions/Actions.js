import React, { useMemo, useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Input, Select,
  Row, Col, Statistic, Alert, Spin, Modal, notification
} from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import mockData from '../../services/mockData';
import mockApi from '../../services/mockApi';
import { formatDate } from '../../utils';
import {
  ACTION_TYPES,
  getActionTypeColor,
  getActionTypeLabel,
  canViewPV
} from '../../utils/actionHelpers';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function Actions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { actions: apiActions, users: apiUsers, loading } = useMock();

  const baseActions = useMemo(
    () => (apiActions?.length ? apiActions : mockData.actions || []),
    [apiActions]
  );
  const allUsers = useMemo(
    () => (apiUsers?.length ? apiUsers : mockData.users || []),
    [apiUsers]
  );

  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState();
  const [selectedStatus, setSelectedStatus] = useState();
  const [dateRange, setDateRange] = useState();

  const scopedActions = useMemo(() => {
    if (user?.role === 'AGENT_AUTORITE') {
      return baseActions.filter(
        (a) =>
          a.userId === user.id ||
          a.user?.id === user.id ||
          a.commune === user.commune
      );
    }
    return baseActions;
  }, [baseActions, user]);

  const [filteredActions, setFilteredActions] = useState(scopedActions);

  useEffect(() => {
    let list = [...scopedActions];

    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (a) =>
          a.observations?.toLowerCase().includes(q) ||
          a.commune?.toLowerCase().includes(q) ||
          allUsers.find((u) => u.id === (a.userId || a.user?.id))?.nom
            ?.toLowerCase()
            .includes(q)
      );
    }

    if (selectedType) list = list.filter((a) => a.type === selectedType);
    if (selectedStatus) list = list.filter((a) => a.status === selectedStatus);

    if (dateRange?.length === 2) {
      const [start, end] = dateRange;
      const s = dayjs(start).startOf('day');
      const e = dayjs(end).endOf('day');
      list = list.filter((a) => {
        const d = dayjs(a.date);
        return d.isAfter(s.subtract(1, 'ms')) && d.isBefore(e.add(1, 'ms'));
      });
    }

    setFilteredActions(list);
  }, [scopedActions, searchText, selectedType, selectedStatus, dateRange, allUsers]);

  const stats = {
    total: filteredActions.length,
    demolitions: filteredActions.filter((a) => a.type === 'DEMOLITION').length,
    signalements: filteredActions.filter((a) => a.type === 'SIGNALEMENT').length,
    avecPV: filteredActions.filter((a) => !!a.pvId).length,
  };

  const agentName = (a) =>
    allUsers.find((u) => u.id === (a.userId || a.user?.id))?.nom ||
    a.user?.name ||
    '—';

  const isReadOnly = user?.role !== 'AGENT_AUTORITE';

  const handleEdit = (record) => {
    navigate(`/actions/edit/${record.id}`);
  };

  const handleDelete = async (record) => {
    try {
      await mockApi.deleteAction(record.id);
      notification.success({
        message: 'Action supprimée',
        description: 'L\'action a été supprimée avec succès.'
      });
      window.location.reload();
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: 'Impossible de supprimer l\'action.'
      });
    }
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = (record) => {
    confirm({
      title: 'Confirmer la suppression',
      content: `Êtes-vous sûr de vouloir supprimer cette action du ${formatDate(record.date)} ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk() {
        handleDelete(record);
      },
    });
  };

 const handlePV = async (record) => {
    if (record.pvId) {
      navigate(`/actions/pv/${record.pvId}`);
    } else {
      try {
        const pvData = {
          actionId: record.id,
          type: record.type,
          statut: 'BROUILLON',
          contenu: {
            titre: `Procès-verbal ${getActionTypeLabel(record.type)}`,
            constatations: record.observations || '',
            decisions: '',
            photos: { before: null, after: null }
          },
          action: record,
          createdAt: new Date().toISOString(),
          createdBy: user.id
        };

        const createdPV = await mockApi.createPV(pvData);
        await mockApi.updateAction(record.id, { pvId: createdPV.id });

        notification.success({ message: 'PV créé', description: 'Le procès-verbal a été créé en brouillon.' });
        navigate(`/actions/pv/${createdPV.id}`);
      } catch (error) {
        notification.error({ message: 'Erreur', description: 'Impossible de créer le PV.' });
      }
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d) => formatDate(d),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      width: 110,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t) => <Tag color={getActionTypeColor(t)}>{getActionTypeLabel(t)}</Tag>,
      filters: Object.entries(ACTION_TYPES).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.type === v,
      width: 170,
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_, r) => <Text>{agentName(r)}</Text>,
      width: 220,
    },
    { title: 'Commune', dataIndex: 'commune', key: 'commune', width: 150 },
    {
      title: 'Observations',
      dataIndex: 'observations',
      key: 'observations',
      render: (t) => <Text ellipsis={{ tooltip: t }}>{t || '—'}</Text>,
    },
    {
      title: 'PV',
      key: 'pv',
      render: (_, r) => {
        if (r.pvId) {
          return (
            <Button
              type="link"
              size="small"
              disabled={!canViewPV(user, r)}
              onClick={() => navigate(`/actions/pv/${r.pvId}`)}
            >
              Voir PV
            </Button>
          );
        } else if (user?.role === 'AGENT_AUTORITE' && (r.userId === user.id || r.user?.id === user.id)) {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => handlePV(r)}
            >
              Créer PV
            </Button>
          );
        }
        return <Text type="secondary">—</Text>;
      },
      width: 90,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (isReadOnly) {
          return <Text type="secondary">—</Text>;
        }

        const canModify = record.userId === user.id || record.user?.id === user.id;
        
        if (!canModify) {
          return <Text type="secondary">Non autorisé</Text>;
        }

        return (
          <Space size="small">
            <Button 
              type="link" 
              size="small"
              onClick={() => handleEdit(record)}
            >
              Modifier
            </Button>
            <Button 
              type="link" 
              size="small" 
              danger
              onClick={() => confirmDelete(record)}
            >
              Supprimer
            </Button>
          </Space>
        );
      },
      width: 130,
    },
  ];

  if (loading && !apiActions?.length) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" tip="Chargement des actions..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>Actions sur le terrain</Title>
          <Text type="secondary">
            {user?.role === 'AGENT_AUTORITE'
              ? `Actions de ${user.commune}`
              : 'Toutes les actions de la préfecture'}
          </Text>
        </div>

        {user?.role === 'AGENT_AUTORITE' && (
          <Button type="primary" onClick={() => navigate('/actions/nouveau')}>
            Nouvelle action
          </Button>
        )}
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} lg={6}><Card><Statistic title="Total actions" value={stats.total} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={8} lg={6}><Card><Statistic title="Démolitions" value={stats.demolitions} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col xs={24} sm={8} lg={6}><Card><Statistic title="Signalements" value={stats.signalements} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={8} lg={6}><Card><Statistic title="Avec PV" value={stats.avecPV} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      {/* Filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Search
              placeholder="Rechercher (obs., commune, agent)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Type d'action"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
            >
              {Object.entries(ACTION_TYPES).map(([k, cfg]) => (
                <Option key={k} value={k}>{cfg.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Statut"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allowClear
            >
              <Option value="EN_ATTENTE">En attente</Option>
              <Option value="EN_COURS">En cours</Option>
              <Option value="TERMINEE">Terminée</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tableau */}
      <Card>
        {filteredActions.length ? (
          <Table
            columns={columns}
            dataSource={filteredActions}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            scroll={{ x: 900 }}
            size="small"
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Aucune action trouvée"
            description="Aucune action ne correspond aux critères"
          />
        )}
      </Card>
    </div>
  );
}