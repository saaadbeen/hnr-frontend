import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button, Card, Typography, Space, Alert } from 'antd';
import { 
  LockOutlined, 
  HomeOutlined, 
  ArrowLeftOutlined,
  LoginOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  fallback = null,
  allowedRoles = null,
  redirectTo = '/login',
  showDetails = true
}) => {
  const { user, loading, isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  // Affichage du loader avec contexte
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <Card style={{ textAlign: 'center', minWidth: 300 }}>
          <Space direction="vertical" size={16}>
            <Spin size="large" />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Vérification des accès...
              </Title>
              <Text type="secondary">
                Authentification en cours
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  // Redirection login
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // Vérification des rôles (si spécifiés)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const ErrorContent = () => (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 500, textAlign: 'center' }}>
          <Result
            status="403"
            icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
            title="Rôle insuffisant"
            subTitle={
              <div>
                <Text>Votre rôle <strong>{formatRole(user.role)}</strong> ne permet pas d'accéder à cette section.</Text>
                {showDetails && (
                  <div style={{ marginTop: 12 }}>
                    <Alert 
                      type="info" 
                      message={`Rôles autorisés : ${allowedRoles.map(formatRole).join(', ')}`}
                      showIcon
                    />
                  </div>
                )}
              </div>
            }
            extra={
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => window.history.back()}
                >
                  Retour
                </Button>
                <Button 
                  type="primary" 
                  icon={<HomeOutlined />}
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Accueil
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );

    return fallback || <ErrorContent />;
  }

  // Vérification des permissions spécifiques
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const PermissionError = () => (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: 600, textAlign: 'center' }}>
          <Result
            status="403"
            icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
            title="Accès refusé"
            subTitle={
              <div>
                <Text>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</Text>
                {showDetails && (
                  <div style={{ marginTop: 16 }}>
                    <Space direction="vertical">
                      <Alert 
                        type="warning"
                        message={`Permission requise : ${requiredPermission}`}
                        description={`Votre rôle actuel : ${formatRole(user.role)}`}
                        showIcon
                      />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Contactez votre administrateur pour obtenir les droits nécessaires.
                      </Text>
                    </Space>
                  </div>
                )}
              </div>
            }
            extra={
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => window.history.back()}
                >
                  Retour
                </Button>
                <Button 
                  type="primary" 
                  icon={<HomeOutlined />}
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Tableau de bord
                </Button>
                <Button 
                  icon={<LoginOutlined />}
                  onClick={() => window.location.href = '/profile'}
                >
                  Mon profil
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );

    return fallback || <PermissionError />;
  }

  return children;
};

// Helper pour formater les rôles
const formatRole = (role) => {
  switch (role) {
    case 'GOUVERNEUR': return 'Gouverneur';
    case 'MEMBRE_DSI': return 'Membre DSI';
    case 'AGENT_AUTORITE': return "Agent d'autorité";
    default: return role || 'Utilisateur';
  }
};

export default ProtectedRoute;