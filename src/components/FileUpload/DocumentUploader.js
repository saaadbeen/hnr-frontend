import React, { useState } from 'react';
import { 
  Upload, 
  message, 
  Button, 
  Space, 
  Typography, 
  Image, 
  Card,
  Modal,
  Progress,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  InboxOutlined, 
  UploadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  CameraOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Text } = Typography;

// Types de fichiers acceptés
const FILE_TYPES = {
  PHOTOS: {
    accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
    maxSize: 10, // MB
    label: 'Photos (JPG, PNG, GIF)',
    icon: <FileImageOutlined />
  },
  PDF: {
    accept: '.pdf',
    maxSize: 20, // MB
    label: 'Documents PDF',
    icon: <FilePdfOutlined />
  },
  ALL: {
    accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf',
    maxSize: 20, // MB
    label: 'Photos et PDF',
    icon: <InboxOutlined />
  }
};

// Contextes d'utilisation
const UPLOAD_CONTEXTS = {
  ACTION_PHOTOS: 'ACTION_PHOTOS',       // Photos avant/après pour actions
  CHANGEMENT_DOCS: 'CHANGEMENT_DOCS',   // Documents pour déclarations
  PV_ANNEXES: 'PV_ANNEXES'              // Annexes pour PV
};

const DocumentUploader = ({
  context = UPLOAD_CONTEXTS.ACTION_PHOTOS,
  fileType = 'ALL',
  maxFiles = 5,
  onChange,
  value = [],
  disabled = false,
  required = false,
  showBeforeAfter = false // Pour les photos avant/après
}) => {
  const [fileList, setFileList] = useState(value);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const fileConfig = FILE_TYPES[fileType] || FILE_TYPES.ALL;

  // Validation avant upload
  const beforeUpload = (file) => {
    const isValidType = validateFileType(file, fileType);
    if (!isValidType) {
      message.error(`Format de fichier non supporté. Formats acceptés: ${fileConfig.label}`);
      return false;
    }

    const isValidSize = file.size / 1024 / 1024 < fileConfig.maxSize;
    if (!isValidSize) {
      message.error(`Le fichier doit faire moins de ${fileConfig.maxSize}MB`);
      return false;
    }

    if (fileList.length >= maxFiles) {
      message.error(`Maximum ${maxFiles} fichiers autorisés`);
      return false;
    }

    return false; // Empêcher l'upload automatique
  };

  // Validation du type de fichier
  const validateFileType = (file, type) => {
    const acceptedTypes = FILE_TYPES[type]?.accept.split(',').map(t => t.trim()) || [];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return acceptedTypes.includes(fileExtension);
  };

  // Gestion des changements de fichiers
  const handleChange = ({ fileList: newFileList }) => {
    const processedList = newFileList.map(file => {
      if (file.originFileObj && !file.url && !file.preview) {
        // Générer preview pour les images
        if (file.type?.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            file.preview = e.target.result;
            setFileList([...fileList]);
          };
          reader.readAsDataURL(file.originFileObj);
        }
      }
      return file;
    });

    setFileList(processedList);
    onChange?.(processedList);
  };

  // Prévisualisation des fichiers
  const handlePreview = (file) => {
    if (file.type?.startsWith('image/')) {
      setPreviewImage(file.url || file.preview);
      setPreviewVisible(true);
      setPreviewTitle(file.name);
    } else if (file.type === 'application/pdf') {
      // Ouvrir PDF dans nouvel onglet
      const url = file.url || URL.createObjectURL(file.originFileObj);
      window.open(url, '_blank');
    }
  };

  // Suppression de fichier
  const handleRemove = (file) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid);
    setFileList(newFileList);
    onChange?.(newFileList);
  };

  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    } else if (file.type === 'application/pdf') {
      return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    }
    return <InboxOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />;
  };

  // Rendu pour photos avant/après
  const renderBeforeAfterUpload = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Card
          title="Photo AVANT"
          size="small"
          extra={
            <Button
              type="text"
              icon={<CameraOutlined />}
              size="small"
            />
          }
        >
          <Dragger
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onPreview={handlePreview}
            fileList={fileList.filter(f => f.category === 'before')}
            accept={fileConfig.accept}
            disabled={disabled}
            maxCount={1}
            style={{ minHeight: 150 }}
          >
            <p className="ant-upload-drag-icon">
              <CameraOutlined style={{ color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">
              Photo avant intervention
            </p>
            <p className="ant-upload-hint">
              Formats: JPG, PNG (max {fileConfig.maxSize}MB)
            </p>
          </Dragger>
        </Card>
      </Col>
      
      <Col span={12}>
        <Card
          title="Photo APRÈS"
          size="small"
          extra={
            <Button
              type="text"
              icon={<CameraOutlined />}
              size="small"
            />
          }
        >
          <Dragger
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onPreview={handlePreview}
            fileList={fileList.filter(f => f.category === 'after')}
            accept={fileConfig.accept}
            disabled={disabled}
            maxCount={1}
            style={{ minHeight: 150 }}
          >
            <p className="ant-upload-drag-icon">
              <CameraOutlined style={{ color: '#52c41a' }} />
            </p>
            <p className="ant-upload-text">
              Photo après intervention
            </p>
            <p className="ant-upload-hint">
              Formats: JPG, PNG (max {fileConfig.maxSize}MB)
            </p>
          </Dragger>
        </Card>
      </Col>
    </Row>
  );

  // Rendu upload standard
  const renderStandardUpload = () => (
    <Dragger
      beforeUpload={beforeUpload}
      onChange={handleChange}
      onPreview={handlePreview}
      onRemove={handleRemove}
      fileList={fileList}
      accept={fileConfig.accept}
      disabled={disabled}
      multiple={maxFiles > 1}
    >
      <p className="ant-upload-drag-icon">
        {fileConfig.icon}
      </p>
      <p className="ant-upload-text">
        Cliquez ou glissez vos fichiers ici
      </p>
      <p className="ant-upload-hint">
        {fileConfig.label} (max {fileConfig.maxSize}MB par fichier)
        {maxFiles > 1 && ` - Maximum ${maxFiles} fichiers`}
      </p>
    </Dragger>
  );

  // Rendu de la liste des fichiers uploadés
  const renderFileList = () => (
    <div style={{ marginTop: 16 }}>
      {fileList.map((file) => (
        <Card 
          key={file.uid} 
          size="small" 
          style={{ marginBottom: 8 }}
          actions={[
            <Tooltip title="Prévisualiser">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(file)}
              />
            </Tooltip>,
            <Tooltip title="Supprimer">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(file)}
                disabled={disabled}
              />
            </Tooltip>
          ]}
        >
          <Card.Meta
            avatar={getFileIcon(file)}
            title={
              <Text ellipsis style={{ maxWidth: 200 }}>
                {file.name}
              </Text>
            }
            description={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                {file.status === 'uploading' && (
                  <Progress 
                    percent={file.percent} 
                    size="small" 
                    style={{ width: 100 }} 
                  />
                )}
              </Space>
            }
          />
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      {showBeforeAfter ? renderBeforeAfterUpload() : renderStandardUpload()}
      
      {fileList.length > 0 && !showBeforeAfter && renderFileList()}
      
      {/* Informations contextuelles */}
      <div style={{ marginTop: 16 }}>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Fichiers uploadés: {fileList.length}/{maxFiles}
          </Text>
          {required && fileList.length === 0 && (
            <Text type="danger" style={{ fontSize: 12 }}>
              <ExclamationCircleOutlined /> Fichiers requis
            </Text>
          )}
        </Space>
      </div>

      {/* Modal de prévisualisation */}
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image
          alt="Prévisualisation"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

// Composant spécialisé pour les actions (photos avant/après)
export const ActionPhotoUploader = (props) => (
  <DocumentUploader
    {...props}
    context={UPLOAD_CONTEXTS.ACTION_PHOTOS}
    fileType="PHOTOS"
    maxFiles={2}
    showBeforeAfter={true}
  />
);

// Composant spécialisé pour les déclarations de changements
export const ChangementDocUploader = (props) => (
  <DocumentUploader
    {...props}
    context={UPLOAD_CONTEXTS.CHANGEMENT_DOCS}
    fileType="ALL"
    maxFiles={5}
  />
);

// Composant spécialisé pour les annexes de PV
export const PVAnnexeUploader = (props) => (
  <DocumentUploader
    {...props}
    context={UPLOAD_CONTEXTS.PV_ANNEXES}
    fileType="ALL"
    maxFiles={3}
  />
);

export default DocumentUploader;
export { UPLOAD_CONTEXTS, FILE_TYPES };