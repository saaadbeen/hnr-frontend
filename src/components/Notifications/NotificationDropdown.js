import React, { useState } from 'react';
import {
  Dropdown, Badge, Button, List, Typography, Empty, Space, Avatar, 
  Tooltip, Divider
} from 'antd';
import {
  BellOutlined, DeleteOutlined, CheckOutlined, 
  UserOutlined, EnvironmentOutlined, FileTextOutlined,
  ExclamationCircleOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNotifications, NOTIFICATION_TYPES } from '../../contexts/NotificationContext';

const { Text } = Typography;

const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead,
    loading 
  } = useNotifications();
  
  const [visible, setVisible] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.MISSION_ASSIGNED:
        return <Avatar style={{ backgroundColor: '#1890ff' }} size="small" icon={<EnvironmentOutlined />} />;
      case NOTIFICATION_TYPES.ACTION_COMPLETED:
        return <Avatar style={{ backgroundColor: '#52c41a' }} size="small" icon={<CheckOutlined />} />;
      case NOTIFICATION_TYPES.PV_GENERATED:
        return <Avatar style={{ backgroundColor: '#722ed1' }} size="small" icon={<FileTextOutlined />} />;
      case NOTIFICATION_TYPES.CHANGEMENT_DECLARED:
        return <Avatar style={{ backgroundColor: '#faad14' }} size="small" icon={<ExclamationCircleOutlined />} />;
      case NOTIFICATION_TYPES.MISSION_CREATED:
        return <Avatar style={{ backgroundColor: '#13c2c2' }} size="small" icon={<EnvironmentOutlined />} />;
      case NOTIFICATION_TYPES.SYSTEM_UPDATE:
        return <Avatar style={{ backgroundColor: '#d9d9d9' }} size="small" icon={<SettingOutlined />} />;
      default:
        return <Avatar style={{ backgroundColor: '#d9d9d9' }} size="small" icon={<BellOutlined />} />;
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    console.log('Navigation vers:', notification.data);
    
    // Fermer le dropdown
    setVisible(false);
  };

  // Supprimer une notification
  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // Marquer comme lu
  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}j`;
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const dropdownContent = (
    <div style={{ 
      width: 400, 
      maxHeight: 500, 
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
      border: '1px solid #d9d9d9',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BellOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Badge 
              count={unreadCount} 
              style={{ backgroundColor: '#ff4d4f' }}
            />
          )}
        </div>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small"
            onClick={markAllAsRead}
            style={{ fontSize: 12 }}
          >
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* Liste des notifications */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Text type="secondary">Chargement...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40 }}>
            <Empty 
              description="Aucune notification"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? '#fff' : '#f6ffed',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Space size="small">
                    {!notification.isRead && (
                      <Tooltip title="Marquer comme lu">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          style={{ color: '#52c41a' }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="Supprimer">
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={(e) => handleDelete(e, notification.id)}
                      />
                    </Tooltip>
                  </Space>
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: 4 
                    }}>
                      <Text 
                        strong={!notification.isRead} 
                        style={{ 
                          fontSize: 14,
                          color: notification.isRead ? '#666' : '#000'
                        }}
                      >
                        {notification.title}
                      </Text>
                      <Text 
                        type="secondary" 
                        style={{ fontSize: 11 }}
                      >
                        {formatRelativeTime(notification.createdAt)}
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <Text 
                        style={{ 
                          fontSize: 13, 
                          color: notification.isRead ? '#999' : '#666',
                          lineHeight: 1.4,
                          display: 'block',
                          marginBottom: 6
                        }}
                      >
                        {notification.message}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          De: {notification.senderName}
                        </Text>
                        {!notification.isRead && (
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#1890ff'
                          }} />
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          textAlign: 'center'
        }}>
          <Button 
            type="link" 
            size="small"
            style={{ fontSize: 12 }}
            onClick={() => {
              console.log('Voir toutes les notifications');
              setVisible(false);
            }}
          >
            Voir toutes les notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottomRight"
      overlayClassName="notification-dropdown"
    >
      <Button 
        type="text" 
        icon={
          <Badge 
            count={unreadCount} 
            size="small"
            offset={[4, -4]}
            style={{ 
              backgroundColor: unreadCount > 0 ? '#ff4d4f' : 'transparent',
              color: '#fff',
              fontSize: 10
            }}
          >
            <BellOutlined 
              style={{ 
                fontSize: 18, 
                color: unreadCount > 0 ? '#1890ff' : '#666'
              }} 
            />
          </Badge>
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 6
        }}
      />
    </Dropdown>
  );
};

export default NotificationDropdown;