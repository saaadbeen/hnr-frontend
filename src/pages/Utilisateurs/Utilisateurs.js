import React, { useMemo, useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Typography, Input, Select, Row, Col,
  Statistic, Alert, Modal, Form, notification, Avatar
} from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import mockApi from '../../services/mockApi';
import { useMock } from '../../services/mockApi';
import { formatDate, isReadOnly } from '../../utils';
import { COMMUNES_BY_PREFECTURE } from '../../services/mockData';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function Utilisateurs() {
  const { user, hasPermission } = useAuth();
  const { users } = useMock();

  const allCommunes = useMemo(() => {
    const arr = Object.values(COMMUNES_BY_PREFECTURE).flat();
    return Array.from(new Set(arr));
  }, []);

  const communeToPrefecture = useMemo(() => {
    const map = {};
    Object.entries(COMMUNES_BY_PREFECTURE).forEach(([pref, communes]) => {
      communes.forEach((c) => { map[c] = pref; });
    });
    return map;
  }, []);

  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  const getRoleColor = (role) =>
    ({ GOUVERNEUR: 'purple', MEMBRE_DSI: 'blue', AGENT_AUTORITE: 'green' }[role] || 'default');
  const formatRole = (role) =>
    ({ GOUVERNEUR: 'Gouverneur', MEMBRE_DSI: 'Membre DSI', AGENT_AUTORITE: "Agent d'autorité" }[role] || role);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchText ||
      u.nom.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase());
    const matchRole = !selectedRole || u.role === selectedRole;
    const matchCommune = !selectedCommune || u.commune === selectedCommune;
    return matchSearch && matchRole && matchCommune;
  });

  const stats = {
    total: filteredUsers.length,
    gouverneurs: filteredUsers.filter((u) => u.role === 'GOUVERNEUR').length,
    dsi: filteredUsers.filter((u) => u.role === 'MEMBRE_DSI').length,
    agents: filteredUsers.filter((u) => u.role === 'AGENT_AUTORITE').length,
  };

  const openModal = (u = null) => {
    setSelectedUser(u);
    if (u) {
      const patch = { ...u };
      if (u.commune && communeToPrefecture[u.commune]) {
        patch.prefecture = communeToPrefecture[u.commune];
      }
      form.setFieldsValue(patch);
    } else {
      form.resetFields();
    }
    setUserModalVisible(true);
  };
  const closeModal = () => {
    setUserModalVisible(false);
    setSelectedUser(null);
    form.resetFields();
  };

  const onCommuneChange = (value) => {
    form.setFieldsValue({ prefecture: communeToPrefecture[value] || '' });
  };

  const saveUser = async (values) => {
    try {
      if (selectedUser) {
        await mockApi.updateUser(selectedUser.id, values);
        notification.success({ message: 'Utilisateur modifié' });
      } else {
        await mockApi.createUser(values);
        notification.success({ message: 'Utilisateur créé' });
      }
      closeModal();
    } catch (e) {
      notification.error({ message: 'Erreur', description: e.message || "Impossible d'enregistrer" });
    }
  };

  // Suppression définitive
  const handleDelete = (record) => {
    confirm({
      title: 'Supprimer cet utilisateur ?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>Utilisateur :</strong> {record.nom}</p>
          <p><strong>Email :</strong> {record.email}</p>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            ⚠️ Cette action est irréversible. L'utilisateur sera définitivement supprimé du système.
          </p>
        </div>
      ),
      okText: 'Supprimer',
      okButtonProps: { danger: true },
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await mockApi.deleteUser(record.id);
          notification.success({ 
            message: 'Utilisateur supprimé', 
            description: `${record.nom} a été supprimé du système`
          });
        } catch (e) {
          notification.error({ 
            message: 'Erreur', 
            description: e.message || "Impossible de supprimer l'utilisateur" 
          });
        }
      }
    });
  };

  const columns = [
    {
      title: 'Utilisateur',
      key: 'user',
      width: 260,
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: getRoleColor(record.role) }}>
            {record.nom?.charAt(0) || '?'}
          </Avatar>
          <div>
            <Text strong>{record.nom}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      width: 150,
      filters: [
        { text: 'Gouverneur', value: 'GOUVERNEUR' },
        { text: 'Membre DSI', value: 'MEMBRE_DSI' },
        { text: "Agent d'autorité", value: 'AGENT_AUTORITE' },
      ],
      onFilter: (v, r) => r.role === v,
      render: (role) => <Tag color={getRoleColor(role)}>{formatRole(role)}</Tag>,
    },
    { title: 'Commune', dataIndex: 'commune', width: 140 },
    { title: 'Préfecture', dataIndex: 'prefecture', width: 280 },
    { title: 'Téléphone', dataIndex: 'telephone', width: 140 },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      width: 110,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (d) => formatDate(d),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => openModal(record)}
            disabled={!hasPermission?.('canManageUsers') || isReadOnly(user, record)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={
              !hasPermission?.('canManageUsers') ||
              record.role === 'MEMBRE_DSI' ||
              record.id === user?.id // Empêcher la suppression de soi-même
            }
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Gestion des utilisateurs</Title>
          <Text type="secondary">Administration des comptes utilisateurs du système</Text>
        </div>
      </div>

      {/* stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}><Card><Statistic title="Total utilisateurs" value={stats.total} /></Card></Col>
        <Col xs={24} sm={6}><Card><Statistic title="Gouverneurs" value={stats.gouverneurs} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col xs={24} sm={6}><Card><Statistic title="Membres DSI" value={stats.dsi} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={6}><Card><Statistic title="Agents terrain" value={stats.agents} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      {/* filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Search placeholder="Rechercher par nom ou email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
          </Col>
          <Col xs={24} sm={8}>
            <Select placeholder="Filtrer par rôle" value={selectedRole} onChange={setSelectedRole} allowClear style={{ width: '100%' }}>
              <Option value="GOUVERNEUR">Gouverneur</Option>
              <Option value="MEMBRE_DSI">Membre DSI</Option>
              <Option value="AGENT_AUTORITE">Agent d'autorité</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select placeholder="Filtrer par commune" value={selectedCommune} onChange={setSelectedCommune} allowClear style={{ width: '100%' }}>
              {allCommunes.map((c) => (<Option key={c} value={c}>{c}</Option>))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        {/* bouton ici */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          {hasPermission?.('canManageUsers') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              Nouvel utilisateur
            </Button>
          )}
        </div>

        {filteredUsers.length ? (
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t, r) => `${r[0]}-${r[1]} sur ${t} utilisateurs`,
            }}
            scroll={{ x: 1100 }}
            size="small"
          />
        ) : (
          <Alert type="info" showIcon message="Aucun utilisateur trouvé" description="Aucun utilisateur ne correspond aux critères de recherche" />
        )}
      </Card>

      {/* modal création/édition */}
      <Modal
        title={selectedUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        open={userModalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={saveUser}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="nom" label="Nom complet" rules={[{ required: true, message: 'Nom requis' }]}>
                <Input placeholder="Nom et prénom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email requis' },
                  { type: 'email', message: 'Email invalide' },
                ]}
              >
                <Input placeholder="saad@example.ma" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
                <Select placeholder="Sélectionner">
                  <Option value="GOUVERNEUR">Gouverneur</Option>
                  <Option value="MEMBRE_DSI">Membre DSI</Option>
                  <Option value="AGENT_AUTORITE">Agent d'autorité</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="commune" label="Commune" rules={[{ required: true }]}>
                <Select placeholder="Sélectionner" onChange={onCommuneChange}>
                  {allCommunes.map((c) => (<Option key={c} value={c}>{c}</Option>))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prefecture" label="Préfecture" rules={[{ required: true }]}>
                <Input placeholder="Préfecture" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="telephone"
            label="Téléphone"
            rules={[
              { required: true, message: 'Téléphone requis' },
              { pattern: /^(\+212|0)[5-7]\d{8}$/, message: 'Format téléphone invalide' },
            ]}
          >
            <Input placeholder="+212 6 12 34 56 78" />
          </Form.Item>

          {!selectedUser && (
            <Form.Item name="password" label="Mot de passe " rules={[{ required: true }]}>
              <Input.Password placeholder="Mot de passe " />
            </Form.Item>
          )}

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={closeModal}>Annuler</Button>
              <Button type="primary" htmlType="submit">{selectedUser ? 'Modifier' : 'Créer'}</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}