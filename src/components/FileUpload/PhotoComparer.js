import React, { useMemo, useState } from 'react';
import {
  Card,
  Image,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Modal,
  Tag,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  ExpandOutlined,
  SwapOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;


export default function PhotoComparer({
  before,
  after,
  photoBefore,
  photoAfter,
  title = 'Comparaison Avant/Après',
  showMetadata = true,
  allowFullscreen = true,
}) {
  const leftInitial = before || photoBefore || null;
  const rightInitial = after || photoAfter || null;

  const [left, setLeft] = useState(leftInitial);
  const [right, setRight] = useState(rightInitial);

  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const [fullscreenMode, setFullscreenMode] = useState('compare');

  React.useEffect(() => {
    setLeft(leftInitial);
  }, [leftInitial]);
  React.useEffect(() => {
    setRight(rightInitial);
  }, [rightInitial]);

  const bothAvailable = useMemo(() => !!left && !!right, [left, right]);

  const openFullscreen = (mode = 'compare') => {
    setFullscreenMode(mode);
    setFullscreenOpen(true);
  };

  const downloadPhoto = (photo, filename) => {
    if (!photo) return;
    const href = photo.url || photo.preview;
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.download = filename || photo.name || `photo-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMetadata = (file) => {
    if (!file) return null;
    return {
      name: file.name || '—',
      size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      type: file.type || 'image/jpeg',
      lastModified: file.lastModified
        ? new Date(file.lastModified).toLocaleString('fr-FR')
        : 'N/A',
    };
  };

  const renderPhotoCard = (photo, label, type, color) => {
    const meta = getMetadata(photo);
    const src = photo?.url || photo?.preview || null;

    return (
      <Card
        title={
          <Space>
            <Tag color={color}>{label}</Tag>
            {meta && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {meta.size}
              </Text>
            )}
          </Space>
        }
        size="small"
        extra={
          <Space>
            {src && (
              <Tooltip title="Voir en grand">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => openFullscreen(type === 'before' ? 'before' : 'after')}
                />
              </Tooltip>
            )}
            {photo && (
              <Tooltip title="Télécharger">
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  size="small"
                  onClick={() =>
                    downloadPhoto(photo, `${type}-${Date.now()}.jpg`)
                  }
                />
              </Tooltip>
            )}
          </Space>
        }
        style={{ height: '100%' }}
      >
        {src ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={src}
              alt={`Photo ${label.toLowerCase()}`}
              style={{
                maxWidth: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              preview={false}
              onClick={() => openFullscreen(type === 'before' ? 'before' : 'after')}
            />

            {showMetadata && meta && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#666' }}>
                <div>📷 {meta.name}</div>
                <div>📅 {meta.lastModified}</div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: 4,
            }}
          >
            <Text type="secondary">Aucune photo {label.toLowerCase()}</Text>
          </div>
        )}
      </Card>
    );
  };

  const renderControls = () => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          <Text strong>{title}</Text>
        </Space>

        <Space wrap>
          {bothAvailable && allowFullscreen && (
            <Button
              icon={<ExpandOutlined />}
              size="small"
              onClick={() => openFullscreen('compare')}
            >
              Comparaison plein écran
            </Button>
          )}

          {bothAvailable && (
            <Button
              icon={<SwapOutlined />}
              size="small"
              onClick={() => {
                setLeft((prevLeft) => {
                  const tmp = right;
                  setRight(prevLeft);
                  return tmp;
                });
              }}
            >
              Échanger
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );

  const renderSideBySide = () => (
    <Row gutter={16}>
      <Col span={12}>
        {renderPhotoCard(left, 'AVANT', 'before', 'orange')}
      </Col>
      <Col span={12}>
        {renderPhotoCard(right, 'APRÈS', 'after', 'green')}
      </Col>
    </Row>
  );

  const modalBody = () => {
    if (fullscreenMode === 'before') {
      const src = left?.url || left?.preview || null;
      return (
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Photo AVANT</Title>
          {src ? (
            <Image src={src} alt="Photo avant" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          ) : (
            <Text type="secondary">Aucune photo</Text>
          )}
        </div>
      );
    }
    if (fullscreenMode === 'after') {
      const src = right?.url || right?.preview || null;
      return (
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Photo APRÈS</Title>
          {src ? (
            <Image src={src} alt="Photo après" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          ) : (
            <Text type="secondary">Aucune photo</Text>
          )}
        </div>
      );
    }
    // Mode comparaison
    return (
      <>
        <Row gutter={24}>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ color: '#fa8c16' }}>AVANT</Title>
              {left ? (
                <Image
                  src={left.url || left.preview}
                  alt="Photo avant"
                  style={{ maxWidth: '100%', maxHeight: '60vh' }}
                />
              ) : (
                <div
                  style={{
                    height: 300,
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text type="secondary">Aucune photo avant</Text>
                </div>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ color: '#52c41a' }}>APRÈS</Title>
              {right ? (
                <Image
                  src={right.url || right.preview}
                  alt="Photo après"
                  style={{ maxWidth: '100%', maxHeight: '60vh' }}
                />
              ) : (
                <div
                  style={{
                    height: 300,
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text type="secondary">Aucune photo après</Text>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button onClick={() => setFullscreenMode('compare')}>
              Voir comparaison
            </Button>
            {left && (
              <Button
                onClick={() => setFullscreenMode('before')}
                type={fullscreenMode === 'before' ? 'primary' : 'default'}
              >
                Photo AVANT
              </Button>
            )}
            {right && (
              <Button
                onClick={() => setFullscreenMode('after')}
                type={fullscreenMode === 'after' ? 'primary' : 'default'}
              >
                Photo APRÈS
              </Button>
            )}
          </Space>
        </div>
      </>
    );
  };

  return (
    <div>
      {renderControls()}
      {renderSideBySide()}

      <Modal
        open={fullscreenOpen}
        onCancel={() => setFullscreenOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        title={`Comparaison ${title}`}
        destroyOnClose
      >
        {modalBody()}
      </Modal>
    </div>
  );
}
