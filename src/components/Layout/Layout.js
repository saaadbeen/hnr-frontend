import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, USER_ROLES } from '../../contexts/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function AppLayout() {
  const { user, logout, canAccessUsers, isReadOnly } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Menu items selon les permissions
  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Tableau de bord'
      },
      {
        key: '/carte',
        icon: <EnvironmentOutlined />,
        label: 'Carte interactive'
      },
      {
        key: '/missions',
        icon: <EnvironmentOutlined />,
        label: 'Missions'
      },
      {
        key: '/actions',
        icon: <ThunderboltOutlined />,
        label: `Actions ${isReadOnly() ? '(Lecture)' : ''}`
      },
      {
        key: '/changements',
        icon: <AlertOutlined />,
        label: 'Changements'
      }
    ];

    if (canAccessUsers()) {
      items.push({
        key: '/utilisateurs',
        icon: <TeamOutlined />,
        label: 'Utilisateurs'
      });
    }

    return items;
  };

  // Menu utilisateur
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Mon profil'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Paramètres'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Déconnexion',
      onClick: () => {
        if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
          logout();
        }
      }
    }
  ];

  // Badge rôle utilisateur
  const getRoleBadge = () => {
    const roleConfig = {
      [USER_ROLES.MEMBRE_DSI]: { color: 'purple', text: 'DSI' },
      [USER_ROLES.GOUVERNEUR]: { color: 'gold', text: 'Gouverneur' },
      [USER_ROLES.AGENT_AUTORITE]: { color: 'blue', text: 'Agent' }
    };
    
    const config = roleConfig[user?.role] || { color: 'default', text: 'User' };
    return <Badge color={config.color} text={config.text} />;
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Titre de page dynamique
  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Tableau de bord',
      '/carte': 'Carte interactive',
      '/missions': 'Missions',
      '/missions/nouveau': 'Nouvelle mission',
      '/actions': 'Actions',
      '/actions/nouveau': 'Nouvelle action',
      '/changements': 'Changements',
      '/changements/nouveau': 'Déclarer changement',
      '/utilisateurs': 'Utilisateurs'
    };
    
    return titles[location.pathname] || 'HNR Monitor';
  };

  const shouldShowSubtitle = () => {
    if (location.pathname === '/dashboard' && user?.role === 'AGENT_AUTORITE') {
      return false;
    }
    return true;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #1890ff 100%)',
          boxShadow: '2px 0 6px rgba(0,0,0,0.1)'
        }}
        width={250}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          background: 'rgba(255,255,255,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? (
            <div style={{ 
              width: 32, 
              height: 32, 
              background: '#1890ff', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              H
            </div>
          ) : (
            <div>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                HNR Monitor
              </Text>
            </div>
          )}
        </div>

        {/* Menu principal */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ 
            background: 'transparent',
            border: 'none',
            marginTop: 16
          }}
        />

        {/* Info utilisateur en bas */}
        {!collapsed && user && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: 12
          }}>
            <Space direction="vertical" size={4}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {user.fullName || user.nom}
              </Text>
              <div>{getRoleBadge()}</div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                {user.commune}, {user.prefecture}
              </Text>
            </Space>
          </div>
        )}
      </Sider>

      {/* Layout principal */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, marginRight: 16 }}
            />
            
            {/* Titre de page */}
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {getPageTitle()}
              </Text>
              {/* Sous-titre conditionnel - masqué pour agents dans dashboard */}
              {shouldShowSubtitle() && user?.role === 'AGENT_AUTORITE' && location.pathname !== '/dashboard' && (
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                  Zone: {user.commune}, {user.prefecture}
                </Text>
              )}
              {isReadOnly() && (
                <Badge 
                  count="Lecture seule" 
                  style={{ 
                    backgroundColor: '#faad14',
                    marginLeft: 12,
                    fontSize: 10
                  }} 
                />
              )}
            </div>
          </div>

          <Space size={16}>
            {/* Notifications */}
            <Badge count={0} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: 16 }}
              />
            </Badge>

            {/* Menu utilisateur */}
            <Dropdown 
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer', padding: '8px 12px' }}>
                <Avatar 
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <div style={{ textAlign: 'left', minWidth: 120 }}>
                  <Text strong style={{ fontSize: 14, display: 'block', lineHeight: '16px' }}>
                    {user?.fullName || user?.nom}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {getRoleBadge()}
                  </div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Contenu principal avec Outlet pour routing imbriqué */}
        <Content style={{
          margin: 0,
          padding: 0,
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;