import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Row, Col } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'

interface RegisterForm {
  phoneNumber: string
  verificationCode: string
  password: string
  confirmPassword: string
  realName: string
  idCard: string
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const onFinish = async (values: RegisterForm) => {
    try {
      setIsLoading(true)
      
      // TODO: 实现注册逻辑
      // 1. 验证表单数据
      // 2. 调用注册API
      // 3. 处理注册结果
      // 4. 跳转到登录页面或自动登录
      
      console.log('注册表单数据:', values)
      message.success('注册成功，请登录')
      navigate('/login')
    } catch (error) {
      message.error('注册失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const sendVerificationCode = async () => {
    try {
      const phoneNumber = form.getFieldValue('phoneNumber')
      if (!phoneNumber) {
        message.error('请先输入手机号')
        return
      }

      // TODO: 实现发送验证码逻辑
      // 1. 验证手机号格式
      // 2. 调用发送验证码API
      // 3. 启动倒计时
      
      console.log('发送验证码到:', phoneNumber)
      message.success('验证码已发送')
      
      // 启动60秒倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      message.error('发送验证码失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">用户注册</h1>
          <p className="text-gray-600 mt-2">创建您的12306账户</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="手机号"
            name="phoneNumber"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="验证码"
            name="verificationCode"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' }
            ]}
          >
            <Row gutter={8}>
              <Col span={16}>
                <Input
                  placeholder="请输入验证码"
                  size="large"
                  maxLength={6}
                />
              </Col>
              <Col span={8}>
                <Button
                  size="large"
                  onClick={sendVerificationCode}
                  disabled={countdown > 0}
                  className="w-full"
                >
                  {countdown > 0 ? `${countdown}s` : '发送验证码'}
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少6位' },
              { max: 20, message: '密码长度不能超过20位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="realName"
            rules={[
              { required: true, message: '请输入真实姓名' },
              { min: 2, message: '姓名长度至少2位' },
              { max: 10, message: '姓名长度不能超过10位' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入真实姓名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="身份证号"
            name="idCard"
            rules={[
              { required: true, message: '请输入身份证号' },
              { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号格式' }
            ]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="请输入身份证号"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-600">已有账户？</span>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 ml-1">
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default RegisterPage