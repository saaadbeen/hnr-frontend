import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Image, 
  Button, 
  Space, 
  Typography, 
  Modal,
  Tag,
  Tooltip,
  Progress,
  Alert,
  Collapse,
  List,
  Row,
  Col,
  Spin,message
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
  CopyOutlined,
  ShareAltOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const FilePreview = ({ 
  files = [],
  showThumbnails = true,
  showMetadata = true,
  allowDelete = true,
  allowDownload = true,
  allowFullscreen = true,
  onDelete,
  onDownload,
  groupByType = false,
  maxPreviewSize = 5, // MB - taille max pour preview inline
  layout = 'grid',
  title = "Aperçu des fichiers"
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingFiles, setLoadingFiles] = useState({});
  const [fileStats, setFileStats] = useState({});

  useEffect(() => {
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
      imageCount: files.filter(f => f.type?.startsWith('image/')).length,
      pdfCount: files.filter(f => f.type === 'application/pdf').length,
      otherCount: files.filter(f => !f.type?.startsWith('image/') && f.type !== 'application/pdf').length
    };
    setFileStats(stats);
  }, [files]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file, size = 24) => {
    if (file.type?.startsWith('image/')) {
      return <FileImageOutlined style={{ fontSize: size, color: '#1890ff' }} />;
    } else if (file.type === 'application/pdf') {
      return <FilePdfOutlined style={{ fontSize: size, color: '#ff4d4f' }} />;
    }
    return <InfoCircleOutlined style={{ fontSize: size, color: '#d9d9d9' }} />;
  };

  const getFileStatus = (file) => {
    if (file.status === 'uploading') {
      return { color: 'processing', icon: <Spin size="small" />, text: 'Upload...' };
    } else if (file.status === 'done') {
      return { color: 'success', icon: <CheckCircleOutlined />, text: 'Réussi' };
    } else if (file.status === 'error') {
      return { color: 'error', icon: <CloseCircleOutlined />, text: 'Erreur' };
    }
    return { color: 'default', icon: <InfoCircleOutlined />, text: 'En attente' };
  };

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setPreviewVisible(true);

    if (file.type === 'application/pdf' && !file.url && file.originFileObj) {
      const url = URL.createObjectURL(file.originFileObj);
      setPreviewFile({ ...file, tempUrl: url });
    }
  };

  const handleDownload = (file) => {
    if (onDownload) {
      onDownload(file);
    } else {
      const url = file.url || file.tempUrl || URL.createObjectURL(file.originFileObj);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || `file-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (file) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: `Êtes-vous sûr de vouloir supprimer "${file.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: () => {
        if (onDelete) {
          onDelete(file);
        }
      }
    });
  };

  const copyFileUrl = (file) => {
    const url = file.url || file.tempUrl;
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        message.success('URL copiée dans le presse-papiers');
      }).catch(() => {
        console.warn('Impossible de copier l\'URL');
      });
    }
  };

  const renderThumbnail = (file) => {
    if (!showThumbnails) return null;

    const isImage = file.type?.startsWith('image/');
    const src = file.url || file.preview || file.thumbUrl;

    if (isImage && src) {
      return (
        <div style={{ width: 60, height: 60, overflow: 'hidden', borderRadius: 4, marginRight: 12 }}>
          <Image
            src={src}
            alt={file.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover', cursor: 'pointer' }}
            preview={false}
            onClick={() => handlePreview(file)}
          />
        </div>
      );
    }

    return (
      <div style={{ 
        width: 60, 
        height: 60, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fafafa',
        borderRadius: 4,
        marginRight: 12,
        cursor: 'pointer'
      }} onClick={() => handlePreview(file)}>
        {getFileIcon(file, 32)}
      </div>
    );
  };

  const renderMetadata = (file) => {
    if (!showMetadata) return null;

    const metadata = [
      { label: 'Taille', value: formatFileSize(file.size) },
      { label: 'Type', value: file.type || 'Inconnu' },
      { label: 'Modifié', value: file.lastModified ? new Date(file.lastModified).toLocaleString('fr-FR') : 'N/A' }
    ];

    return (
      <Collapse size="small" ghost>
        <Panel header="Détails" key="metadata" style={{ fontSize: 12 }}>
          {metadata.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary">{item.label}:</Text>
              <Text code style={{ fontSize: 11 }}>{item.value}</Text>
            </div>
          ))}
        </Panel>
      </Collapse>
    );
  };

  const renderActions = (file) => {
    const actions = [];

    if (allowFullscreen) {
      actions.push(
        <Tooltip title="Prévisualiser" key="preview">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(file)}
          />
        </Tooltip>
      );
    }

    if (allowDownload) {
      actions.push(
        <Tooltip title="Télécharger" key="download">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownload(file)}
          />
        </Tooltip>
      );
    }

    if (file.url) {
      actions.push(
        <Tooltip title="Copier l'URL" key="copy">
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => copyFileUrl(file)}
          />
        </Tooltip>
      );
    }

    if (allowDelete) {
      actions.push(
        <Tooltip title="Supprimer" key="delete">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(file)}
          />
        </Tooltip>
      );
    }

    return actions;
  };

  // Rendu d'un fichier en mode liste
  const renderFileItem = (file) => {
    const status = getFileStatus(file);

    return (
      <Card 
        key={file.uid} 
        size="small" 
        style={{ marginBottom: 8 }}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {renderThumbnail(file)}
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <Text strong ellipsis title={file.name}>
                  {file.name}
                </Text>
                
                <div style={{ marginTop: 4 }}>
                  <Space size="small">
                    <Tag color={status.color} icon={status.icon}>
                      {status.text}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatFileSize(file.size)}
                    </Text>
                  </Space>
                </div>

                {file.status === 'uploading' && file.percent !== undefined && (
                  <Progress 
                    percent={file.percent} 
                    size="small" 
                    style={{ marginTop: 8 }}
                    showInfo={false}
                  />
                )}
              </div>

              <Space>
                {renderActions(file)}
              </Space>
            </div>

            {renderMetadata(file)}
          </div>
        </div>
      </Card>
    );
  };

  // Rendu en mode grille
  const renderGridLayout = () => (
    <Row gutter={[16, 16]}>
      {files.map((file) => (
        <Col xs={24} sm={12} md={8} lg={6} key={file.uid}>
          <Card
            size="small"
            cover={
              showThumbnails && file.type?.startsWith('image/') && (file.url || file.preview) ? (
                <div style={{ height: 120, overflow: 'hidden' }}>
                  <Image
                    src={file.url || file.preview}
                    alt={file.name}
                    width="100%"
                    height={120}
                    style={{ objectFit: 'cover', cursor: 'pointer' }}
                    preview={false}
                    onClick={() => handlePreview(file)}
                  />
                </div>
              ) : (
                <div style={{ 
                  height: 120, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#fafafa'
                }}>
                  {getFileIcon(file, 48)}
                </div>
              )
            }
            actions={renderActions(file)}
          >
            <Card.Meta
              title={
                <Text ellipsis title={file.name} style={{ fontSize: 12 }}>
                  {file.name}
                </Text>
              }
              description={
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatFileSize(file.size)}
                  </Text>
                  {(() => {
                    const status = getFileStatus(file);
                    return <Tag color={status.color} size="small">{status.text}</Tag>;
                  })()}
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Rendu des statistiques
  const renderStats = () => {
    if (files.length === 0) return null;

    return (
      <Alert
        message={
          <Space>
            <InfoCircleOutlined />
            <Text strong>
              {fileStats.totalFiles} fichier{fileStats.totalFiles > 1 ? 's' : ''} 
              ({formatFileSize(fileStats.totalSize)})
            </Text>
            {fileStats.imageCount > 0 && (
              <Tag color="blue">{fileStats.imageCount} image{fileStats.imageCount > 1 ? 's' : ''}</Tag>
            )}
            {fileStats.pdfCount > 0 && (
              <Tag color="red">{fileStats.pdfCount} PDF</Tag>
            )}
          </Space>
        }
        type="info"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />
    );
  };

  // Rendu de la modal de prévisualisation
  const renderPreviewModal = () => (
    <Modal
      visible={previewVisible}
      title={previewFile?.name}
      onCancel={() => {
        setPreviewVisible(false);
        if (previewFile?.tempUrl) {
          URL.revokeObjectURL(previewFile.tempUrl);
        }
      }}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={() => handleDownload(previewFile)}>
          Télécharger
        </Button>,
        <Button key="close" onClick={() => setPreviewVisible(false)}>
          Fermer
        </Button>
      ]}
      width="80vw"
      style={{ top: 20 }}
    >
      {previewFile && (
        <div style={{ textAlign: 'center', minHeight: 400 }}>
          {previewFile.type?.startsWith('image/') ? (
            <Image
              src={previewFile.url || previewFile.preview || previewFile.tempUrl}
              alt={previewFile.name}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          ) : previewFile.type === 'application/pdf' ? (
            <div style={{ height: '70vh' }}>
              <iframe
                src={previewFile.url || previewFile.tempUrl}
                width="100%"
                height="100%"
                title={previewFile.name}
                style={{ border: 'none' }}
              />
            </div>
          ) : (
            <div style={{ padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {getFileIcon(previewFile, 48)}
              </div>
              <Title level={4}>{previewFile.name}</Title>
              <Text type="secondary">
                Prévisualisation non disponible pour ce type de fichier
              </Text>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  // Rendu principal
  if (files.length === 0) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
          <InfoCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <div>Aucun fichier à afficher</div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {title && <Title level={5}>{title}</Title>}
      {renderStats()}
      
      {layout === 'grid' ? renderGridLayout() : (
        <div>
          {files.map(renderFileItem)}
        </div>
      )}
      
      {renderPreviewModal()}
    </div>
  );
};

export default FilePreview;