import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, Table, InputNumber, message, Steps, Row, Col, Divider, Space, Tag } from 'antd';
import { UserOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';

const { Option } = Select;
const { Step } = Steps;

interface Passenger {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  passengerType: string;
}

interface SeatSelection {
  passengerId: string;
  seatType: string;
  seatNumber?: string;
}

const TicketBookingPage: React.FC = observer(() => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [seatSelections, setSeatSelections] = useState<SeatSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { train, searchParams } = location.state || {};

  useEffect(() => {
    if (!train) {
      message.error('请先选择车次');
      navigate('/search');
      return;
    }
    
    fetchPassengers();
  }, [train, navigate]);

  const fetchPassengers = async () => {
    try {
      // TODO: 调用API获取用户乘车人列表
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
    }
  };

  const handlePassengerSelect = (selectedPassengerIds: string[]) => {
    const newSelections = selectedPassengerIds.map(passengerId => ({
      passengerId,
      seatType: 'secondClass', // 默认二等座
    }));
    setSeatSelections(newSelections);
  };

  const handleSeatTypeChange = (passengerId: string, seatType: string) => {
    setSeatSelections(prev => 
      prev.map(selection => 
        selection.passengerId === passengerId 
          ? { ...selection, seatType }
          : selection
      )
    );
  };

  const calculateTotalPrice = () => {
    return seatSelections.reduce((total, selection) => {
      switch (selection.seatType) {
        case 'business':
          return total + train.businessPrice;
        case 'firstClass':
          return total + train.firstClassPrice;
        case 'secondClass':
          return total + train.secondClassPrice;
        default:
          return total;
      }
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (seatSelections.length === 0) {
      message.error('请选择乘车人');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用API创建订单
      const orderData = {
        trainId: train.id,
        passengers: seatSelections.map(selection => {
          const passenger = passengers.find(p => p.id === selection.passengerId);
          return {
            passengerId: selection.passengerId,
            name: passenger?.name,
            idCard: passenger?.idCard,
            seatType: selection.seatType,
          };
        }),
        totalPrice: calculateTotalPrice(),
        departureDate: searchParams?.departureDate?.format('YYYY-MM-DD'),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (response.ok) {
        message.success('订单创建成功');
        navigate('/orders', { state: { newOrderId: data.orderId } });
      } else {
        message.error(data.message || '订单创建失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getSeatTypeText = (seatType: string) => {
    switch (seatType) {
      case 'business':
        return '商务座';
      case 'firstClass':
        return '一等座';
      case 'secondClass':
        return '二等座';
      default:
        return '';
    }
  };

  const getSeatPrice = (seatType: string) => {
    switch (seatType) {
      case 'business':
        return train.businessPrice;
      case 'firstClass':
        return train.firstClassPrice;
      case 'secondClass':
        return train.secondClassPrice;
      default:
        return 0;
    }
  };

  const passengerColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '证件号码',
      dataIndex: 'idCard',
      key: 'idCard',
    },
    {
      title: '乘客类型',
      dataIndex: 'passengerType',
      key: 'passengerType',
      render: (type: string) => (
        <Tag color={type === 'adult' ? 'blue' : 'green'}>
          {type === 'adult' ? '成人' : '儿童'}
        </Tag>
      ),
    },
    {
      title: '座位类型',
      key: 'seatType',
      render: (record: Passenger) => {
        const selection = seatSelections.find(s => s.passengerId === record.id);
        return selection ? (
          <Select
            value={selection.seatType}
            onChange={(value) => handleSeatTypeChange(record.id, value)}
            style={{ width: 120 }}
          >
            {train.secondClassSeat > 0 && (
              <Option value="secondClass">二等座 ¥{train.secondClassPrice}</Option>
            )}
            {train.firstClassSeat > 0 && (
              <Option value="firstClass">一等座 ¥{train.firstClassPrice}</Option>
            )}
            {train.businessSeat > 0 && (
              <Option value="business">商务座 ¥{train.businessPrice}</Option>
            )}
          </Select>
        ) : null;
      },
    },
    {
      title: '票价',
      key: 'price',
      render: (record: Passenger) => {
        const selection = seatSelections.find(s => s.passengerId === record.id);
        return selection ? (
          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            ¥{getSeatPrice(selection.seatType)}
          </span>
        ) : null;
      },
    },
  ];

  if (!train) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        <Step title="选择乘车人" icon={<UserOutlined />} />
        <Step title="确认订单" icon={<CreditCardOutlined />} />
        <Step title="完成预订" icon={<CheckCircleOutlined />} />
      </Steps>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="车次信息" style={{ marginBottom: '24px' }}>
            <Row>
              <Col span={8}>
                <div><strong>车次：</strong>{train.trainNumber}</div>
                <div><strong>出发站：</strong>{train.departure}</div>
                <div><strong>到达站：</strong>{train.arrival}</div>
              </Col>
              <Col span={8}>
                <div><strong>出发时间：</strong>{train.departureTime}</div>
                <div><strong>到达时间：</strong>{train.arrivalTime}</div>
                <div><strong>历时：</strong>{train.duration}</div>
              </Col>
              <Col span={8}>
                <div><strong>出发日期：</strong>{searchParams?.departureDate?.format('YYYY-MM-DD')}</div>
              </Col>
            </Row>
          </Card>

          <Card title="选择乘车人">
            <Form form={form} layout="vertical">
              <Form.Item
                name="passengerIds"
                label="请选择乘车人"
                rules={[{ required: true, message: '请至少选择一位乘车人' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择乘车人"
                  onChange={handlePassengerSelect}
                  style={{ width: '100%' }}
                >
                  {passengers.map(passenger => (
                    <Option key={passenger.id} value={passenger.id}>
                      {passenger.name} ({passenger.idCard})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            {seatSelections.length > 0 && (
              <Table
                columns={passengerColumns}
                dataSource={passengers.filter(p => 
                  seatSelections.some(s => s.passengerId === p.id)
                )}
                rowKey="id"
                pagination={false}
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="订单信息">
            <div style={{ marginBottom: '16px' }}>
              <div><strong>车次：</strong>{train.trainNumber}</div>
              <div><strong>日期：</strong>{searchParams?.departureDate?.format('YYYY-MM-DD')}</div>
              <div><strong>乘车人数：</strong>{seatSelections.length}人</div>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: '16px' }}>
              {seatSelections.map(selection => {
                const passenger = passengers.find(p => p.id === selection.passengerId);
                return passenger ? (
                  <div key={selection.passengerId} style={{ marginBottom: '8px' }}>
                    <div>{passenger.name} - {getSeatTypeText(selection.seatType)}</div>
                    <div style={{ color: '#ff4d4f' }}>¥{getSeatPrice(selection.seatType)}</div>
                  </div>
                ) : null;
              })}
            </div>
            
            <Divider />
            
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              总计：<span style={{ color: '#ff4d4f' }}>¥{calculateTotalPrice()}</span>
            </div>
            
            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleSubmitOrder}
              disabled={seatSelections.length === 0}
            >
              提交订单
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
});

export default TicketBookingPage;