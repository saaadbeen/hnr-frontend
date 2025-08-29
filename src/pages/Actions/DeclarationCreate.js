import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, notification } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import mockApi from '../../services/mockApi';

const { Option } = Select;

export default function DeclarationCreate() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const ch = await mockApi.createChangement(values);
      notification.success({ message: 'Changement déclaré' });
      navigate('/missions/nouveau', { state: { changementId: ch.id } });
    } catch (e) {
      notification.error({ message: 'Erreur', description: e.message || '—' });
    } finally { setLoading(false); }
  };

  return (
    <Card title="Déclarer un changement" style={{ maxWidth: 700, margin: '24px auto' }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="douar" label="Douar" rules={[{ required: true }]}><Input placeholder="Nom du douar" /></Form.Item>
        <Form.Item name="type" label="Type" initialValue="HORIZONTAL" rules={[{ required: true }]}>
          <Select>
            <Option value="HORIZONTAL">Horizontal</Option>
            <Option value="VERTICAL">Vertical</Option>
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Enregistrer</Button>
      </Form>
    </Card>
  );
}
