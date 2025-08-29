import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Button, Badge, Drawer } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  AlertOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../Notifications';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // ❌ Bloque l’UI d’installation PWA (mini-infobar / bouton auto)
  useEffect(() => {
    const stopInstallUI = (e) => {
      e.preventDefault();
      e.stopPropagation?.();
      return false;
    };
    window.addEventListener('beforeinstallprompt', stopInstallUI);
    // optionnel : on peut écouter l'installation pour nettoyer un éventuel state
    const onInstalled = () => {/* no-op, juste pour silence */};
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', stopInstallUI);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Responsive breakpoint check
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = useMemo(() => {
    const items = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
      { key: '/carte', icon: <EnvironmentOutlined />, label: 'Carte interactive' },
      { key: '/missions', icon: <FlagOutlined />, label: 'Missions' }
    ];
    if (hasPermission('canCreateActions')) items.push({ key: '/actions', icon: <AlertOutlined />, label: 'Actions' });
    items.push({ key: '/changements', icon: <ExclamationCircleOutlined />, label: 'Changements' });
    if (hasPermission('canManageUsers')) items.push({ key: '/utilisateurs', icon: <UserOutlined />, label: 'Utilisateurs' });
    if (hasPermission('canViewStats')) items.push({ key: '/stats', icon: <BarChartOutlined />, label: 'Statistiques' });
    return items;
  }, [hasPermission]);

  const userMenuItems = useMemo(() => [
    { key: 'profile', icon: <UserOutlined />, label: 'Mon profil' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Paramètres' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', onClick: logout }
  ], [logout]);

  const handleMenuClick = useCallback(({ key }) => {
    if (key === 'logout') {
      logout();
    } else {
      navigate(key);
      if (isMobile) setMobileDrawerOpen(false);
    }
  }, [logout, navigate, isMobile]);

  const handleToggleSider = useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setCollapsed(!collapsed);
    }
  }, [isMobile, mobileDrawerOpen, collapsed]);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard': return 'Tableau de bord';
      case '/carte': return 'Carte interactive';
      case '/missions': return 'Missions';
      case '/missions/nouveau': return 'Nouvelle mission';
      case '/actions': return 'Actions';
      case '/actions/nouveau': return 'Nouvelle action';
      case '/changements': return 'Gestion des changements';
      case '/changements/nouveau': return 'Déclarer un changement';
      case '/utilisateurs': return 'Gestion des utilisateurs';
      case '/stats': return 'Statistiques';
      default: return 'Surveillance des habitats';
    }
  }, [location.pathname]);

  const getRoleBadgeColor = useCallback((role) => {
    switch (role) {
      case 'GOUVERNEUR': return '#722ed1';
      case 'MEMBRE_DSI': return '#1890ff';
      case 'AGENT_AUTORITE': return '#52c41a';
      default: return '#d9d9d9';
    }
  }, []);

  const formatRole = useCallback((role) => {
    switch (role) {
      case 'GOUVERNEUR': return 'Gouverneur';
      case 'MEMBRE_DSI': return 'Membre DSI';
      case 'AGENT_AUTORITE': return "Agent d'autorité";
      default: return role;
    }
  }, []);

  const pageSubtitle = useMemo(() => {
    const path = location.pathname;
    if (path === '/changements') {
      if (user?.role === 'MEMBRE_DSI') return '';
      if (user?.role === 'GOUVERNEUR') return '';
      if (user?.role === 'AGENT_AUTORITE') return '';
    }
    return null;
  }, [location.pathname, user]);

  const SiderContent = () => (
    <>
      <div style={{
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)', margin: '16px', borderRadius: '6px'
      }}>
        <Text style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed && !isMobile ? '14px' : '16px',
          display: collapsed && !isMobile ? 'none' : 'block'
        }}>
          HNR Monitor
        </Text>
        {collapsed && !isMobile && <EnvironmentOutlined style={{ color: 'white', fontSize: '20px' }} />}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems.map(item => ({
          ...item,
          'aria-current': item.key === location.pathname ? 'page' : undefined
        }))}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
        role="navigation"
        aria-label="Navigation principale"
      />

      {(!collapsed || isMobile) && (
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px', right: '16px',
          padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Avatar size="small" style={{ backgroundColor: getRoleBadgeColor(user?.role) }}>
              {user?.nom?.charAt(0) || 'U'}
            </Avatar>
            <div style={{ marginLeft: '8px', flex: 1 }}>
              <Text style={{ color: 'white', fontSize: '12px', display: 'block' }}>
                {user?.nom || 'Utilisateur'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                {user?.commune}
              </Text>
            </div>
          </div>
          <Badge
            color={getRoleBadgeColor(user?.role)}
            text={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{formatRole(user?.role)}</Text>}
          />
        </div>
      )}
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{ background: '#001529', boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}
        >
          <SiderContent />
        </Sider>
      )}

      {/* Mobile Drawer */}
    <Drawer
      placement="left"
      closable={false}
      onClose={() => setMobileDrawerOpen(false)}
      open={isMobile && mobileDrawerOpen}
      styles={{
        body: { padding: 0, background: '#fff' }
      }}
      width={280}
      role="dialog"
      aria-label="Menu de navigation mobile"
    >
      <SiderContent />
    </Drawer>

      <Layout>
        <Header style={{
          padding: isMobile ? '0 16px' : '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleToggleSider}
              style={{
                fontSize: '16px',
                minWidth: 44,
                minHeight: 44,
                width: isMobile ? 44 : 64,
                height: isMobile ? 44 : 64
              }}
              aria-label={isMobile ? "Ouvrir le menu" : (collapsed ? "Développer le menu" : "Réduire le menu")}
              aria-expanded={isMobile ? mobileDrawerOpen : !collapsed}
            />
            <div>
              <Text style={{
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold'
              }}>
                {pageTitle}
              </Text>
              {pageSubtitle && (
                <Text type="secondary" style={{
                  display: 'block',
                  fontSize: isMobile ? '11px' : '12px'
                }}>
                  {pageSubtitle}
                </Text>
              )}
            </div>
          </Space>

          <Space size={isMobile ? 'small' : 'middle'}>
            <NotificationDropdown />
            {!isMobile && (
              <Badge color={getRoleBadgeColor(user?.role)} text={formatRole(user?.role)} />
            )}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
              trigger={['click']}
            >
              <Button
                type="text"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 44,
                  minHeight: 44
                }}
                aria-label="Menu utilisateur"
                aria-haspopup="true"
              >
                <Space>
                  <Avatar size="small" style={{ backgroundColor: getRoleBadgeColor(user?.role) }}>
                    {user?.nom?.charAt(0) || 'U'}
                  </Avatar>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto'
          }}
          role="main"
          aria-label="Contenu principal"
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
