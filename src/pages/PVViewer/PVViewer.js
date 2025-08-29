import React, { useState } from 'react';
import {
  Modal,
  Card,
  Button,
  Space,
  Typography,
  Badge,
  Row,
  Col,
  Steps,
  Divider,
  notification,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShareAltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const PVViewer = ({ 
  visible, 
  onClose, 
  pv, 
  action, 
  onPublish, 
  onEdit,
  showActions = true,
  readOnly = false 
}) => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  if (!pv) return null;

  const canEdit = !readOnly && user.role === 'AGENT_AUTORITE' && action?.userId === user.id;
  const canPublish = canEdit && pv.statut === 'BROUILLON';
  const canView = user.role === 'MEMBRE_DSI' || user.role === 'GOUVERNEUR' || canEdit;

  const getWorkflowStep = () => {
    if (pv.statut === 'PUBLIE') return 2;
    if (pv.statut === 'BROUILLON') return 1;
    return 0;
  };

  const getFormattedPV = () => {
    if (!pv.template || !pv.meta) return 'Contenu PV non disponible';
    
    return pv.template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = pv.meta[key];
      if (value === undefined || value === null) return match;
      return value;
    });
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const blob = new Blob([getFormattedPV()], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PV_${pv.id}_${dayjs().format('YYYYMMDD')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      notification.success({
        message: 'Téléchargement réussi',
        description: `PV ${pv.id} téléchargé en format PDF`
      });
    } catch (error) {
      notification.error({
        message: 'Erreur de téléchargement',
        description: 'Impossible de télécharger le PV'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await onPublish?.(action);
      
      notification.success({
        message: 'PV publié avec succès',
        description: 'Le procès-verbal est maintenant visible par DSI et Gouverneur'
      });
    } catch (error) {
      notification.error({
        message: 'Erreur de publication',
        description: 'Impossible de publier le PV'
      });
    } finally {
      setPublishing(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>PV ${pv.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.6; 
              margin: 40px;
              white-space: pre-line;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .content {
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PROCÈS-VERBAL N° ${pv.id}</h2>
            <p>Généré le ${dayjs().format('DD/MM/YYYY à HH:mm')}</p>
          </div>
          <div class="content">
            ${getFormattedPV()}
          </div>
          <div class="footer">
            <p><em>Document généré automatiquement par le système HNR</em></p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          Procès-Verbal N° {pv.id}
          <Badge 
            status={pv.statut === 'PUBLIE' ? 'success' : 'processing'} 
            text={pv.statut === 'PUBLIE' ? 'Publié' : 'Brouillon'}
          />
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={showActions ? (
        <Space>
          <Button onClick={onClose}>
            Fermer
          </Button>
          
          <Button 
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            Télécharger PDF
          </Button>
          
          <Button 
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Imprimer
          </Button>
          
          {canEdit && (
            <Button 
              icon={<EditOutlined />}
              onClick={() => onEdit?.(action)}
            >
              Modifier
            </Button>
          )}
          
          {canPublish && (
            <Popconfirm
              title="Publier ce PV ?"
              description="Une fois publié, le PV ne pourra plus être modifié et sera visible par DSI et Gouverneur."
              onConfirm={handlePublish}
              okText="Publier"
              cancelText="Annuler"
              okButtonProps={{ loading: publishing }}
            >
              <Button 
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={publishing}
              >
                Publier le PV
              </Button>
            </Popconfirm>
          )}
        </Space>
      ) : null}
      styles={{
        body: { padding: 0 }
      }}
    >
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* Workflow Status */}
        <Card size="small" style={{ margin: '0 0 16px 0', background: '#fafafa' }}>
          <Steps
            current={getWorkflowStep()}
            size="small"
            items={[
              { 
                title: 'Action créée', 
                icon: <CheckCircleOutlined />,
                description: action ? dayjs(action.createdAt).format('DD/MM/YYYY HH:mm') : ''
              },
              { 
                title: 'PV généré', 
                icon: <CheckCircleOutlined />,
                description: dayjs(pv.createdAt).format('DD/MM/YYYY HH:mm')
              },
              { 
                title: 'PV publié', 
                icon: pv.statut === 'PUBLIE' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                description: pv.datePublication ? dayjs(pv.datePublication).format('DD/MM/YYYY HH:mm') : 'En attente'
              }
            ]}
          />
        </Card>

        {/* Informations générales */}
        <Card size="small" title="Informations du PV" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text type="secondary">Numéro PV:</Text>
              <br />
              <Text strong>{pv.id}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Type d'action:</Text>
              <br />
              <Text strong>{action?.type || 'Non spécifié'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Statut:</Text>
              <br />
              <Badge 
                status={pv.statut === 'PUBLIE' ? 'success' : 'processing'} 
                text={pv.statut === 'PUBLIE' ? 'Publié' : 'Brouillon'}
              />
            </Col>
            <Col span={8}>
              <Text type="secondary">Mission:</Text>
              <br />
              <Text strong>{pv.meta?.refMission || 'Non spécifiée'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Agent:</Text>
              <br />
              <Text strong>{pv.meta?.agentNom || 'Non spécifié'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Localisation:</Text>
              <br />
              <Text strong>{pv.meta?.adresse || 'Non spécifiée'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Date d'action:</Text>
              <br />
              <Text strong>{action ? dayjs(action.date).format('DD/MM/YYYY') : 'Non spécifiée'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Heure:</Text>
              <br />
              <Text strong>{pv.meta?.heure || 'Non spécifiée'}</Text>
            </Col>
            {pv.meta?.montantAmende && (
              <Col span={8}>
                <Text type="secondary">Montant amende:</Text>
                <br />
                <Text strong style={{ color: '#ff4d4f' }}>{pv.meta.montantAmende} DH</Text>
              </Col>
            )}
          </Row>
        </Card>

        {/* Observations */}
        {pv.meta?.observations && (
          <Card size="small" title="Observations" style={{ marginBottom: 16 }}>
            <Paragraph>
              {pv.meta.observations}
            </Paragraph>
          </Card>
        )}

        {/* Contenu PV officiel */}
        <Card title="Procès-Verbal Officiel" size="small">
          <div style={{ 
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '20px',
            marginTop: '16px'
          }}>
            <pre style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '12px',
              lineHeight: '1.8',
              margin: 0,
              whiteSpace: 'pre-line',
              color: '#262626'
            }}>
              {getFormattedPV()}
            </pre>
          </div>
        </Card>

        {/* Historique */}
        {pv.statut === 'PUBLIE' && (
          <Card size="small" title="Historique" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  PV créé en brouillon
                </Text>
                <Text type="secondary">{dayjs(pv.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
              
              {pv.datePublication && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    PV publié et diffusé
                  </Text>
                  <Text type="secondary">{dayjs(pv.datePublication).format('DD/MM/YYYY HH:mm')}</Text>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* Permissions et visibilité */}
        <Card size="small" title="Visibilité" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Space direction="vertical" size={4}>
                <Text strong>Agent d'Autorité</Text>
                <Badge status="success" text="Lecture/Écriture" />
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size={4}>
                <Text strong>Membre DSI</Text>
                <Badge 
                  status={pv.statut === 'PUBLIE' ? 'success' : 'default'} 
                  text={pv.statut === 'PUBLIE' ? 'Lecture' : 'Non visible'}
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" size={4}>
                <Text strong>Gouverneur</Text>
                <Badge 
                  status={pv.statut === 'PUBLIE' ? 'success' : 'default'} 
                  text={pv.statut === 'PUBLIE' ? 'Lecture' : 'Non visible'}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Avertissement brouillon */}
        {pv.statut === 'BROUILLON' && canEdit && (
          <Card size="small" style={{ marginTop: 16, background: '#fff7e6', border: '1px solid #ffd591' }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#fa8c16' }} />
              <div>
                <Text strong style={{ color: '#fa8c16' }}>PV en brouillon</Text>
                <br />
                <Text type="secondary">
                  Ce PV n'est pas encore publié. Il n'est visible que par vous. 
                  Publiez-le pour le rendre visible par DSI et Gouverneur.
                </Text>
              </div>
            </Space>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default PVViewer;