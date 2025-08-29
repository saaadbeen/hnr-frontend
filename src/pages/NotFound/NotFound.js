import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: 20
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Désolé, la page que vous recherchez n'existe pas."
        extra={
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            Retour au tableau de bord
          </Button>
        }
      />
    </div>
  );
}