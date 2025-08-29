import React, { useMemo, useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Input, Select,
  Row, Col, Statistic, Alert, Spin, Modal, notification
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, 
  SettingOutlined, FileAddOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMock } from '../../services/mockApi';
import mockData from '../../services/mockData';
import mockApiService from '../../services/mockApi';
import { formatDate } from '../../utils';
import {
  getArrondissementFromCommune,
  getCommunesFromArrondissement,
  isChangeInAgentArea,
  getVisibleCommunesForUser,
  formatArrondissementName
} from '../../utils/arrondissementHelpers';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function Changements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { changements: apiChangements, loading, refetch } = useMock(user);

  const baseChangements = useMemo(
    () => (apiChangements?.length ? apiChangements : mockData.changements || []),
    [apiChangements]
  );

  const scopedChangements = useMemo(() => {
    if (user?.role === 'AGENT_AUTORITE') {
      return baseChangements.filter((c) =>
        isChangeInAgentArea(c, user.commune, user.prefecture)
      );
    }
    return baseChangements;
  }, [baseChangements, user]);

  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState();
  const [selectedStatus, setSelectedStatus] = useState();
  const [selectedCommune, setSelectedCommune] = useState();
  const [filteredChangements, setFilteredChangements] = useState(scopedChangements);

  useEffect(() => {
    let list = [...scopedChangements];

    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (c) =>
          c.description?.toLowerCase().includes(q) ||
          c.commune?.toLowerCase().includes(q) ||
          c.type?.toLowerCase().includes(q)
      );
    }
    if (selectedType) list = list.filter((c) => c.type === selectedType);
    if (selectedStatus) list = list.filter((c) => c.statut === selectedStatus);
    if (selectedCommune) list = list.filter((c) => c.commune === selectedCommune);

    setFilteredChangements(list);
  }, [scopedChangements, searchText, selectedType, selectedStatus, selectedCommune]);

  const stats = useMemo(() => ({
    total: scopedChangements.length,
    detectes: scopedChangements.filter((c) => c.statut === 'DETECTE').length,
    enTraitement: scopedChangements.filter((c) => c.statut === 'EN_TRAITEMENT').length,
    traites: scopedChangements.filter((c) => c.statut === 'TRAITE').length,
  }), [scopedChangements]);

  const availableCommunes = useMemo(
    () => getVisibleCommunesForUser(user, baseChangements),
    [user, baseChangements]
  );

  const userZoneInfo = useMemo(() => {
    if (user?.role !== 'AGENT_AUTORITE' || !user.commune) return null;
    const arrondissement = getArrondissementFromCommune(user.commune);
    const communesArrondissement = arrondissement
      ? getCommunesFromArrondissement(arrondissement)
      : [user.commune];
    return {
      arrondissement: formatArrondissementName(arrondissement),
      communes: communesArrondissement,
      communesPrincipal: user.commune,
    };
  }, [user]);

  const canAddChangement = user?.role === 'MEMBRE_DSI';
  const canManageChangements = user?.role === 'MEMBRE_DSI';

  const handleEdit = (record) => navigate(`/changements/edit/${record.id}`);
  const handleDelete = async (record) => {
    try {
      await mockApiService.deleteChangement(record.id);
      notification.success({ message: 'Changement supprimé' });
      await refetch();
    } catch (error) {
      notification.error({
        message: 'Erreur',
        description: error.message || 'Impossible de supprimer le changement.',
      });
    }
  };
  const confirmDelete = (record) => {
    confirm({
      title: 'Confirmer la suppression',
      content: `Êtes-vous sûr de vouloir supprimer ce changement à ${record.commune} ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk() { handleDelete(record); },
    });
  };
  const handleViewDetails = (record) => navigate(`/changements/details/${record.id}`);
  const handleCreateAction = (record) => {
    navigate(`/actions/nouveau`, {
      state: {
        changementId: record.id,
        changement: record,
        commune: record.commune,
        prefecture: record.prefecture,
        geometry: record.geometry, 
      },
    });
  };

  const handleAddChangement = () => {
    navigate('/changements/nouveau');
  };

  const columns = [
    {
      title: 'Date détection',
      dataIndex: 'dateDetection',
      key: 'dateDetection',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.dateDetection) - new Date(b.dateDetection),
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          EXTENSION_HORIZONTALE: 'blue',
          EXTENSION_VERTICALE: 'orange',
          CONSTRUCTION_NOUVELLE: 'red',
        };
        const labels = {
          EXTENSION_HORIZONTALE: 'Extension horizontale',
          EXTENSION_VERTICALE: 'Extension verticale',
          CONSTRUCTION_NOUVELLE: 'Construction nouvelle',
        };
        return <Tag color={colors[type] || 'default'}>{labels[type] || type}</Tag>;
      },
      filters: [
        { text: 'Extension horizontale', value: 'EXTENSION_HORIZONTALE' },
        { text: 'Extension verticale', value: 'EXTENSION_VERTICALE' },
        { text: 'Construction nouvelle', value: 'CONSTRUCTION_NOUVELLE' },
      ],
      onFilter: (value, record) => record.type === value,
      width: 180,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => {
        const colors = { DETECTE: 'red', EN_TRAITEMENT: 'orange', TRAITE: 'green' };
        const labels = { DETECTE: 'Détecté', EN_TRAITEMENT: 'En traitement', TRAITE: 'Traité' };
        return <Tag color={colors[statut] || 'default'}>{labels[statut] || statut}</Tag>;
      },
      filters: [
        { text: 'Détecté', value: 'DETECTE' },
        { text: 'En traitement', value: 'EN_TRAITEMENT' },
        { text: 'Traité', value: 'TRAITE' },
      ],
      onFilter: (value, record) => record.statut === value,
      width: 130,
    },
    { title: 'Commune', dataIndex: 'commune', key: 'commune', width: 140 },
    {
      title: 'Préfecture',
      dataIndex: 'prefecture',
      key: 'prefecture',
      ellipsis: true,
      render: (prefecture) => (
        <Text ellipsis title={prefecture}>
          {prefecture?.replace("Préfecture d'arrondissements ", '').replace('Préfecture de ', '') || '—'}
        </Text>
      ),
      width: 160,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: { tooltip: true },
      render: (desc) => <Text ellipsis>{desc || '—'}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, record) => {
        const isAgent = user?.role === 'AGENT_AUTORITE';
        const isDSI = user?.role === 'MEMBRE_DSI';
        const canCreateFromAgent = isAgent && record.statut === 'DETECTE';

        return (
          <Space size="small" wrap>
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              Détails
            </Button>

            {/* Création d'action par l'agent d'autorité depuis un changement détecté */}
            {canCreateFromAgent && (
              <Button 
                type="link" 
                size="small"
                icon={<FileAddOutlined />}
                onClick={() => handleCreateAction(record)}
              >
                Créer action
              </Button>
            )}

            {/* DSI : modifier / supprimer (gouverneur = lecture seule) */}
            {isDSI && (
              <>
                <Button 
                  type="link" 
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  Modifier
                </Button>
                <Button 
                  type="link" 
                  size="small" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(record)}
                >
                  Supprimer
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  if (loading && !apiChangements?.length) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" tip="Chargement des changements..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* En-tête avec bouton d'ajout */}
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>Gestion des changements</Title>
          <Text type="secondary">
            {user?.role === 'AGENT_AUTORITE' && userZoneInfo
              ? `Changements détectés dans votre zone de responsabilité - ${userZoneInfo.arrondissement}`
              : 'Liste des changements détectés'}
          </Text>
        </div>

        {/* Boutons d'action pour DSI */}
        {canAddChangement && (
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddChangement}
              size="large"
            >
              Ajouter un changement
            </Button>
            
          </Space>
        )}
      </div>

      {user?.role === 'AGENT_AUTORITE' && userZoneInfo && (
        <Alert
          message="Zone de responsabilité"
          description={
            <div>
              <strong>Arrondissement :</strong> {userZoneInfo.arrondissement}
              <br />
              <strong>Communes :</strong> {userZoneInfo.communes.join(', ')}
              <br />
              <Text type="secondary">
                Vous ne voyez que les changements détectés dans ces communes.
              </Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Message d'information pour DSI */}
      {canAddChangement && filteredChangements.length === 0 && !searchText && !selectedType && !selectedStatus && !selectedCommune && (
        <Alert
          message="Aucun changement détecté"
          description="Aucun changement n'est enregistré dans le système. Utilisez le bouton 'Ajouter un changement' pour créer le premier changement."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddChangement}
            >
              Ajouter maintenant
            </Button>
          }
        />
      )}

      {/* Statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6} lg={6}>
          <Card>
            <Statistic 
              title="Total changements" 
              value={stats.total} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} lg={6}>
          <Card>
            <Statistic 
              title="Détectés" 
              value={stats.detectes} 
              valueStyle={{ color: '#ff4d4f' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} lg={6}>
          <Card>
            <Statistic 
              title="En traitement" 
              value={stats.enTraitement} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={6} lg={6}>
          <Card>
            <Statistic 
              title="Traités" 
              value={stats.traites} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Search
              placeholder="Rechercher description, commune..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select 
              style={{ width: '100%' }} 
              placeholder="Type de changement" 
              value={selectedType} 
              onChange={setSelectedType} 
              allowClear
            >
              <Option value="EXTENSION_HORIZONTALE">Extension horizontale</Option>
              <Option value="EXTENSION_VERTICALE">Extension verticale</Option>
              <Option value="CONSTRUCTION_NOUVELLE">Construction nouvelle</Option>
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
              <Option value="DETECTE">Détecté</Option>
              <Option value="EN_TRAITEMENT">En traitement</Option>
              <Option value="TRAITE">Traité</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select 
              style={{ width: '100%' }} 
              placeholder="Commune" 
              value={selectedCommune} 
              onChange={setSelectedCommune} 
              allowClear
            >
              {availableCommunes.map((commune) => (
                <Option key={commune} value={commune}>{commune}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Message pour agents d'autorité sans changements */}
      {user?.role === 'AGENT_AUTORITE' && scopedChangements.length === 0 && (
        <Alert
          message="Aucun changement détecté"
          description={`Aucun changement n'a été détecté dans votre zone (${userZoneInfo?.communes.join(', ')}).`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Tableau */}
      <Card>
        {filteredChangements.length ? (
          <Table
            columns={columns}
            dataSource={filteredChangements}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} changements`,
            }}
            scroll={{ x: 1200 }}
            size="small"
          />
        ) : searchText || selectedType || selectedStatus || selectedCommune ? (
          <Alert
            type="warning"
            showIcon
            message="Aucun changement trouvé"
            description="Aucun changement ne correspond aux critères. Essayez de modifier/effacer les filtres."
            action={
              <Button
                size="small"
                onClick={() => {
                  setSearchText('');
                  setSelectedType(undefined);
                  setSelectedStatus(undefined);
                  setSelectedCommune(undefined);
                }}
              >
                Effacer les filtres
              </Button>
            }
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="Aucun changement"
            description={
              user?.role === 'AGENT_AUTORITE'
                ? "Aucun changement détecté dans votre zone."
                : "Aucun changement détecté dans le système."
            }
            action={canAddChangement ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddChangement}
              >
                Ajouter un changement
              </Button>
            ) : null}
          />
        )}
      </Card>
    </div>
  );
}