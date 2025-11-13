import React from 'react'
import { Card, Form, Input, Button, DatePicker, Select, Row, Col, Typography } from 'antd'
import { SwapOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

interface SearchForm {
  from: string
  to: string
  departDate: string
  trainType?: string
}

const HomePage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = (values: SearchForm) => {
    // TODO: 实现车票搜索逻辑
    // 1. 验证搜索参数
    // 2. 调用搜索API
    // 3. 跳转到搜索结果页面
    
    console.log('搜索参数:', values)
    navigate('/search', { state: values })
  }

  const handleSwapStations = () => {
    const from = form.getFieldValue('from')
    const to = form.getFieldValue('to')
    form.setFieldsValue({
      from: to,
      to: from
    })
  }

  const popularRoutes = [
    { from: '北京', to: '上海' },
    { from: '北京', to: '广州' },
    { from: '上海', to: '深圳' },
    { from: '北京', to: '西安' },
    { from: '上海', to: '杭州' },
    { from: '广州', to: '深圳' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Title level={1} className="text-blue-600">
            中国铁路12306
          </Title>
          <Title level={3} className="text-gray-600">
            火车票在线预订
          </Title>
        </div>

        <Card className="mb-8 shadow-lg">
          <Title level={2} className="text-center mb-6">
            车票查询
          </Title>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              departDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
              trainType: 'all'
            }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="出发地"
                  name="from"
                  rules={[{ required: true, message: '请输入出发地' }]}
                >
                  <Input placeholder="请输入出发城市" size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={1} className="flex items-center justify-center">
                <Button
                  type="text"
                  icon={<SwapOutlined />}
                  onClick={handleSwapStations}
                  className="mt-6"
                />
              </Col>
              
              <Col xs={24} sm={8}>
                <Form.Item
                  label="目的地"
                  name="to"
                  rules={[{ required: true, message: '请输入目的地' }]}
                >
                  <Input placeholder="请输入目的城市" size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={7}>
                <Form.Item
                  label="出发日期"
                  name="departDate"
                  rules={[{ required: true, message: '请选择出发日期' }]}
                >
                  <DatePicker
                    size="large"
                    className="w-full"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item label="车次类型" name="trainType">
                  <Select size="large">
                    <Option value="all">全部</Option>
                    <Option value="G">高速动车(G)</Option>
                    <Option value="D">动车(D)</Option>
                    <Option value="C">城际(C)</Option>
                    <Option value="K">快速(K)</Option>
                    <Option value="T">特快(T)</Option>
                    <Option value="Z">直达(Z)</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={16} className="flex items-end">
                <Form.Item className="w-full">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SearchOutlined />}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    查询车票
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card title="热门路线" className="shadow-lg">
          <Row gutter={[16, 16]}>
            {popularRoutes.map((route, index) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Button
                  type="link"
                  className="w-full text-left"
                  onClick={() => {
                    form.setFieldsValue({
                      from: route.from,
                      to: route.to
                    })
                  }}
                >
                  {route.from} → {route.to}
                </Button>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  )
}

export default HomePage