import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface LoginForm {
  phoneNumber: string
  password: string
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()

  const onFinish = async (values: LoginForm) => {
    try {
      // TODO: 实现登录逻辑
      // 1. 调用登录API
      // 2. 存储用户信息和Token
      // 3. 跳转到首页
      
      console.log('登录表单数据:', values)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error('登录失败，请检查用户名和密码')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登录12306
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </Link>
          </p>
        </div>
        
        <Card className="shadow-lg">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="phoneNumber"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入手机号"
                maxLength={11}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少8位' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={isLoading}
              >
                登录
              </Button>
            </Form.Item>

            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                忘记密码？
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage