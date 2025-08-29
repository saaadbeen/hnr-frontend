import React, { useEffect, useState } from 'react';
import {
  Layout, Card, Typography, Space, Row, Col, Tag, Button, Form, Input, Upload,
  Divider, Alert, notification, Descriptions, Tooltip, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, FilePdfOutlined, SaveOutlined,
  UploadOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import mockApiService from '../../services/mockApi';
import PhotoComparer from '../../components/FileUpload/PhotoComparer';
import { generatePVPDF } from '../../utils/pdfGenerator';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const ACTION_LABEL = {
  DEMOLITION: 'Démolition',
  SIGNALEMENT: 'Signalement',
  NON_DEMOLITION: 'Non Démolition',
};

const ROLE = {
  MEMBRE_DSI: 'MEMBRE_DSI',
  GOUVERNEUR: 'GOUVERNEUR',
  AGENT_AUTORITE: 'AGENT_AUTORITE',
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function PVEditor() {
  const navigate = useNavigate();
  const { pvId } = useParams();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pv, setPV] = useState(null);

  const isDSI = user?.role === ROLE.MEMBRE_DSI;
  const isGouv = user?.role === ROLE.GOUVERNEUR;

  // Chargement PV
  useEffect(() => {
    (async () => {
      try {
        const data = await mockApiService.getPVById(pvId);
        if (!data) {
          notification.error({ message: 'PV introuvable' });
          navigate('/actions');
          return;
        }
        setPV(data);

        form.setFieldsValue({
          titre: data?.contenu?.titre || `PV ${data?.type || ''}`.trim(),
          constatations: data?.contenu?.constatations || '',
          decisions: data?.contenu?.decisions || '',
        });
      } catch (e) {
        console.error(e);
        notification.error({ message: 'Erreur', description: 'Impossible de charger le PV.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [pvId, navigate, form]);

  // Derivations sans hooks (évite react-hooks/rules-of-hooks)
  const readOnly = !pv || pv?.statut === 'VALIDE' || isDSI || isGouv;

  const photos = {
    before: pv?.contenu?.photos?.before || null,
    after:  pv?.contenu?.photos?.after  || null,
  };

  const hasBothPhotos = !!photos.before && !!photos.after;

  const handleUpload = async (file, which) => {
    const isImage = /image\/(png|jpeg|jpg)/i.test(file.type);
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isImage) { notification.error({ message: 'Format non supporté (JPG/PNG)' }); return Upload.LIST_IGNORE; }
    if (!isLt10M) { notification.error({ message: 'Fichier trop volumineux (max 10MB)' }); return Upload.LIST_IGNORE; }
    const meta = {
      slot: which === 'before' ? 'BEFORE' : 'AFTER',
      name: file.name, size: file.size, type: file.type, lastModified: file.lastModified,
      preview: await toBase64(file),
    };
    setPV(prev => ({
      ...prev,
      contenu: {
        ...prev?.contenu,
        photos: {
          ...(prev?.contenu?.photos || {}),
          [which]: meta,
        }
      }
    }));
    return false;
  };

  const removePhoto = (which) => {
    setPV(prev => ({
      ...prev,
      contenu: {
        ...prev?.contenu,
        photos: { ...(prev?.contenu?.photos || {}), [which]: null }
      }
    }));
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const updated = {
        ...pv,
        contenu: {
          ...(pv?.contenu || {}),
          titre: values.titre,
          constatations: values.constatations,
          decisions: values.decisions,
        }
      };
      const res = await mockApiService.updatePV(pv.id, updated);
      setPV(res);
      notification.success({ message: 'Brouillon enregistré' });
    } catch (e) {
      console.error(e);
      if (!e?.errorFields) notification.error({ message: 'Échec de l’enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const validatePV = async () => {
    if (!hasBothPhotos) {
      notification.warning({ message: 'Photos requises', description: 'Ajoutez la photo AVANT et la photo APRÈS.' });
      return;
    }
    try {
      const values = await form.validateFields();
      const updated = {
        ...pv,
        contenu: {
          ...(pv?.contenu || {}),
          titre: values.titre,
          constatations: values.constatations,
          decisions: values.decisions,
        }
      };
      await mockApiService.updatePV(pv.id, updated);
      const finalPV = await mockApiService.validatePV(pv.id, user.id);
      setPV(finalPV);
      notification.success({ message: 'PV validé' });
    } catch (e) {
      console.error(e);
      notification.error({ message: 'Validation impossible' });
    }
  };

  const exportPDF = async () => {
    try {
      await generatePVPDF(pv);
      notification.success({ message: 'PDF généré' });
    } catch (e) {
      console.error(e);
      notification.error({ message: 'Erreur PDF', description: 'Impossible de générer le PDF.' });
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: 24 }}>
          <Card loading />
        </Content>
      </Layout>
    );
  }

  if (!pv) return null;

  const action = pv.action || {};
  const statutTag = pv.statut === 'VALIDE'
    ? <Tag color="green">Validé</Tag>
    : <Tag color="gold">Brouillon</Tag>;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/actions')} style={{ marginBottom: 16 }}>
          Retour aux actions
        </Button>

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    Procès-verbal — {ACTION_LABEL[pv.type] || pv.type}
                  </Title>
                  <Text type="secondary">N° {pv.numero} — {statutTag}</Text>
                </div>
                <Space>
                  <Tooltip title="Exporter en PDF">
                    <Button icon={<FilePdfOutlined />} onClick={exportPDF} />
                  </Tooltip>
                </Space>
              </div>

              <Divider />

              <Descriptions column={1} size="small" bordered labelStyle={{ width: 220 }}>
                <Descriptions.Item label="Date action">{action?.date ? dayjs(action.date).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
                <Descriptions.Item label="Agent">{action?.user?.name || action?.user?.nom || '—'}</Descriptions.Item>
                <Descriptions.Item label="Localisation">
                  {action?.commune ? `${action.commune} — ${action.prefecture || ''}` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Coordonnées">
                  {action?.geometry?.type === 'Point'
                    ? `${action.geometry.coordinates[1].toFixed(6)}, ${action.geometry.coordinates[0].toFixed(6)}`
                    : '—'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Form
                form={form}
                layout="vertical"
                disabled={readOnly}
                initialValues={{
                  titre: pv?.contenu?.titre || '',
                  constatations: pv?.contenu?.constatations || '',
                  decisions: pv?.contenu?.decisions || '',
                }}
              >
                <Form.Item
                  name="titre"
                  label="Titre du PV"
                  rules={[{ required: true, message: 'Titre requis' }]}
                >
                  <Input placeholder="Ex: Procès-verbal de démolition..." />
                </Form.Item>

                <Form.Item
                  name="constatations"
                  label="Constatations"
                  rules={[{ required: true, message: 'Décrivez les constatations' }, { min: 10 }]}
                >
                  <TextArea rows={4} placeholder="Décrivez les faits observés..." />
                </Form.Item>

                <Form.Item
                  name="decisions"
                  label="Décisions / Mesures prises"
                  rules={[{ required: true, message: 'Renseignez les décisions' }, { min: 5 }]}
                >
                  <TextArea rows={3} placeholder="Ex: Démolition effectuée selon la procédure..." />
                </Form.Item>

                <Divider />

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Photo AVANT">
                      {!photos.before && readOnly && (
                        <Alert type="warning" message="Non fournie" />
                      )}
                      {photos.before && (
                        <img src={photos.before.preview || photos.before.url} alt="before" style={{ width: '100%', borderRadius: 6 }} />
                      )}
                      {!readOnly && (
                        <Space style={{ marginTop: 8 }}>
                          <Upload
                            accept="image/*"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={(file) => handleUpload(file, 'before')}
                          >
                            <Button icon={<UploadOutlined />}>Remplacer</Button>
                          </Upload>
                          {photos.before && (
                            <Popconfirm title="Retirer la photo AVANT ?" onConfirm={() => removePhoto('before')}>
                              <Button danger>Retirer</Button>
                            </Popconfirm>
                          )}
                        </Space>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="Photo APRÈS">
                      {!photos.after && readOnly && (
                        <Alert type="warning" message="Non fournie" />
                      )}
                      {photos.after && (
                        <img src={photos.after.preview || photos.after.url} alt="after" style={{ width: '100%', borderRadius: 6 }} />
                      )}
                      {!readOnly && (
                        <Space style={{ marginTop: 8 }}>
                          <Upload
                            accept="image/*"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={(file) => handleUpload(file, 'after')}
                          >
                            <Button icon={<UploadOutlined />}>Remplacer</Button>
                          </Upload>
                          {photos.after && (
                            <Popconfirm title="Retirer la photo APRÈS ?" onConfirm={() => removePhoto('after')}>
                              <Button danger>Retirer</Button>
                            </Popconfirm>
                          )}
                        </Space>
                      )}
                    </Card>
                  </Col>
                </Row>

                {photos.before && photos.after && (
                  <>
                    <Divider />
                    <Card size="small" title="Comparaison AVANT / APRÈS">
                      <PhotoComparer before={photos.before.preview || photos.before.url} after={photos.after.preview || photos.after.url} />
                    </Card>
                  </>
                )}

                {!hasBothPhotos && (
                  <Alert
                    style={{ marginTop: 16 }}
                    type="warning"
                    message="Photos requises"
                    description="Le PV doit contenir la photo AVANT et la photo APRÈS."
                    showIcon
                  />
                )}

                {!readOnly && (
                  <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Space>
                      <Button onClick={saveDraft} icon={<SaveOutlined />} loading={saving}>
                        Enregistrer brouillon
                      </Button>
                      <Button
                        type="primary"
                        onClick={validatePV}
                        icon={<CheckCircleOutlined />}
                        disabled={!hasBothPhotos}
                      >
                        Valider le PV
                      </Button>
                    </Space>
                  </div>
                )}
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Résumé de l’action" extra={<Tag>{ACTION_LABEL[action?.type] || action?.type || '—'}</Tag>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Agent</Text>
                  <div>{action?.user?.name || action?.user?.nom || '—'}</div>
                </div>
                <div>
                  <Text type="secondary">Date</Text>
                  <div>{action?.date ? dayjs(action.date).format('DD/MM/YYYY HH:mm') : '—'}</div>
                </div>
                <div>
                  <Text type="secondary">Localisation</Text>
                  <div>{action?.commune ? `${action.commune} — ${action.prefecture || ''}` : '—'}</div>
                </div>
                <div>
                  <Text type="secondary">Observations</Text>
                  <div>{action?.observations || '—'}</div>
                </div>
                <Divider />
                <Button icon={<EyeOutlined />} onClick={() => navigate('/actions')}>Retour à la liste</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
