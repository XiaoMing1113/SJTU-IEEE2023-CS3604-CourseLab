import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, message, Row, Col, Divider } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import type { UploadFile } from 'antd/es/upload/interface';

interface UserProfile {
  id: string;
  phone: string;
  realName: string;
  idCard: string;
  email?: string;
  avatar?: string;
  createdAt: string;
}

const ProfilePage: React.FC = observer(() => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        profileForm.setFieldsValue({
          phone: data.user.phone,
          realName: data.user.realName,
          idCard: data.user.idCard,
          email: data.user.email,
        });
      } else {
        message.error(data.message || '获取用户信息失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success('个人信息更新成功');
        setProfile(data.user);
      } else {
        message.error(data.message || '更新失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(data.message || '密码修改失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success('头像上传成功');
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null);
      } else {
        message.error(data.message || '头像上传失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setAvatarLoading(false);
    }
  };

  const uploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
        return false;
      }
      handleAvatarUpload(file);
      return false; // 阻止自动上传
    },
  };

  if (!profile) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col span={16}>
          <Card title="个人信息" style={{ marginBottom: '24px' }}>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col span={12}>
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
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { type: 'email', message: '请输入正确的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="realName"
                    label="真实姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="idCard"
                    label="身份证号"
                    rules={[
                      { required: true, message: '请输入身份证号' },
                      { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号' },
                    ]}
                  >
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="修改密码">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请确认新密码" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={passwordLoading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="头像设置">
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                src={profile.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: '16px' }}
              />
              <div>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />} loading={avatarLoading}>
                    上传头像
                  </Button>
                </Upload>
                <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                  支持 JPG、PNG 格式，文件大小不超过 2MB
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <h4>账户信息</h4>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>用户ID：</span>
                <span>{profile.id}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>注册时间：</span>
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
});

export default ProfilePage;