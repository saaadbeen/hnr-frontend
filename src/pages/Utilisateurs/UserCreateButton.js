import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select, notification } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import mockApi from '../../services/mockApi';

const { Option } = Select;

export default function UserCreateButton({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await mockApi.createUser(values);
      notification.success({ message: 'Utilisateur créé' });
      setOpen(false);
      form.resetFields();
      onCreated?.(); 
    } catch (e) {
      if (e?.errorFields) return; // erreurs de validation
      notification.error({ message: 'Erreur', description: e.message || '—' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Nouvel utilisateur
      </Button>

      <Modal
        title="Créer un utilisateur"
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        confirmLoading={submitting}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nom" label="Nom et prénom" rules={[{ required: true }]}>
            <Input placeholder="Ex: Saad Saad" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="exemple@domaine.ma" />
          </Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              <Option value="GOUVERNEUR">Gouverneur</Option>
              <Option value="MEMBRE_DSI">Membre DSI</Option>
              <Option value="AGENT_AUTORITE">Agent d'autorité</Option>
            </Select>
          </Form.Item>
          <Form.Item name="prefecture" label="Préfecture" rules={[{ required: true }]}>
            <Input placeholder="Ex: Préfectures des Arrondissements de Casablanca Anfa" />
          </Form.Item>
          <Form.Item name="commune" label="Commune" rules={[{ required: true }]}>
            <Input placeholder="Ex: Anfa / Maarif / Mohammedia..." />
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone">
            <Input placeholder="+212 6 xx xx xx xx" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
