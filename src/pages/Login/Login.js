import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Alert,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EnvironmentOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { users as mockUsers } from '../../services/mockData'; 
const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [form] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (values) => {
    setLoginLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    form.setFieldsValue({
      email: user.email,
      password: 'demo123'
    });
    setSelectedUser(user);
  };

  const formatRole = (role) => {
    switch (role) {
      case 'GOUVERNEUR': return 'Gouverneur';
      case 'MEMBRE_DSI': return 'Membre DSI';
      case 'AGENT_AUTORITE': return "Agent d'autorité";
      default: return role;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row gutter={[32, 32]} style={{ width: '100%', maxWidth: '1200px' }}>
        {/* Panneau gauche */}
        <Col xs={24} lg={12}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <EnvironmentOutlined style={{ fontSize: '80px', marginBottom: '24px' }} />
            <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
              HNR
            </Title>
            <Title level={3} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'normal' }}>
              Signalement des Habitats Non Réglementaires
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', display: 'block', marginTop: '24px' }}>
              Plateforme de gestion et de suivi des habitats non réglementaires dans les préfectures de Casablanca & Mohammedia.
            </Text>
          </div>
        </Col>

        {/* Panneau de connexion */}
        <Col xs={24} lg={12}>
          <Card style={{ 
            maxWidth: '400px', 
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={3} style={{ margin: 0 }}>
                Connexion
              </Title>
              <Text type="secondary">
                Accédez à votre espace de travail
              </Text>
            </div>

            {/* Formulaire classique */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email requis' },
                  { type: 'email', message: 'Format email invalide' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="votre.email@domaine.ma"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mot de passe"
                rules={[{ required: true, message: 'Mot de passe requis' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Votre mot de passe"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loginLoading || loading}
                  block
                  style={{ height: '48px' }}
                >
                  Se connecter
                </Button>
              </Form.Item>
            </Form>

            {/* Utilisateurs mock */}
            <div style={{ marginTop: '24px' }}>
              <Alert
                message="Mode démonstration"
                description="Sélectionnez un utilisateur pour tester l'application"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <div>
                <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                  Connexion rapide :
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {mockUsers.map((user) => (
                    <Button
                      key={user.id}
                      type={selectedUser?.id === user.id ? 'primary' : 'default'}
                      block
                      size="small"
                      onClick={() => handleQuickLogin(user)}
                      style={{ 
                        textAlign: 'left',
                        height: 'auto',
                        padding: '8px 12px'
                      }}
                    >
                      <div>
                        <Text strong>{user.nom}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatRole(user.role)} • {user.commune}
                        </Text>
                      </div>
                    </Button>
                  ))}
                </Space>
              </div>

              <Text type="secondary" style={{ 
                display: 'block', 
                marginTop: '12px', 
                fontSize: '12px',
                textAlign: 'center'
              }}>
                Mot de passe de démonstration : <Text code>demo123</Text>
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
