import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';

const { Option } = Select;

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: 'adult' | 'child';
  createdAt: string;
}

const PassengersPage: React.FC = observer(() => {
  const [form] = Form.useForm();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/passengers', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setPassengers(data.passengers || []);
      } else {
        message.error(data.message || '获取乘车人列表失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassenger = () => {
    setEditingPassenger(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditPassenger = (passenger: Passenger) => {
    setEditingPassenger(passenger);
    form.setFieldsValue({
      name: passenger.name,
      idCard: passenger.idCard,
      phone: passenger.phone,
      passengerType: passenger.passengerType,
    });
    setModalVisible(true);
  };

  const handleDeletePassenger = async (passengerId: string) => {
    try {
      const response = await fetch(`/api/passengers/${passengerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success('乘车人删除成功');
        fetchPassengers();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingPassenger 
        ? `/api/passengers/${editingPassenger.id}`
        : '/api/passengers';
      const method = editingPassenger ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success(editingPassenger ? '乘车人更新成功' : '乘车人添加成功');
        setModalVisible(false);
        form.resetFields();
        fetchPassengers();
      } else {
        message.error(data.message || '操作失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  const validateIdCard = (rule: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    
    // 身份证号码验证正则表达式
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    
    if (!idCardRegex.test(value)) {
      return Promise.reject(new Error('请输入正确的身份证号码'));
    }
    
    return Promise.resolve();
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '证件号码',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 200,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: '乘客类型',
      dataIndex: 'passengerType',
      key: 'passengerType',
      width: 100,
      render: (type: string) => (
        <span style={{ 
          color: type === 'adult' ? '#1890ff' : '#52c41a',
          fontWeight: 'bold'
        }}>
          {type === 'adult' ? '成人' : '儿童'}
        </span>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => new Date(time).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: Passenger) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditPassenger(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个乘车人吗？"
            onConfirm={() => handleDeletePassenger(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title="乘车人管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPassenger}>
            添加乘车人
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={passengers}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingPassenger ? '编辑乘车人' : '添加乘车人'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 2, message: '姓名至少2个字符' },
              { max: 20, message: '姓名不能超过20个字符' },
            ]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="idCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { validator: validateIdCard },
            ]}
          >
            <Input placeholder="请输入身份证号" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="passengerType"
            label="乘客类型"
            rules={[{ required: true, message: '请选择乘客类型' }]}
          >
            <Select placeholder="请选择乘客类型">
              <Option value="adult">成人</Option>
              <Option value="child">儿童</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPassenger ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default PassengersPage;