import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Descriptions, Tabs } from 'antd';
import { EyeOutlined, DeleteOutlined, PayCircleOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

interface OrderPassenger {
  id: string;
  name: string;
  idCard: string;
  seatType: string;
  seatNumber?: string;
  ticketPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  trainNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  status: 'pending' | 'paid' | 'cancelled' | 'completed';
  totalPrice: number;
  createdAt: string;
  passengers: OrderPassenger[];
}

const OrdersPage: React.FC = observer(() => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        message.error(data.message || '获取订单列表失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePayOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        message.success('支付成功');
        fetchOrders(); // 刷新订单列表
      } else {
        message.error(data.message || '支付失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    Modal.confirm({
      title: '确认取消订单',
      content: '取消后不可恢复，确定要取消这个订单吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authStore.token}`,
            },
          });
          const data = await response.json();
          
          if (response.ok) {
            message.success('订单已取消');
            fetchOrders(); // 刷新订单列表
          } else {
            message.error(data.message || '取消订单失败');
          }
        } catch (error) {
          message.error('网络错误，请稍后重试');
        }
      },
    });
  };

  const showOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'orange', text: '待支付' },
      paid: { color: 'green', text: '已支付' },
      cancelled: { color: 'red', text: '已取消' },
      completed: { color: 'blue', text: '已完成' },
    };
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getSeatTypeText = (seatType: string) => {
    const seatTypeMap = {
      business: '商务座',
      firstClass: '一等座',
      secondClass: '二等座',
    };
    return seatTypeMap[seatType as keyof typeof seatTypeMap] || seatType;
  };

  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    return orders.filter(order => order.status === activeTab);
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
    },
    {
      title: '车次',
      dataIndex: 'trainNumber',
      key: 'trainNumber',
      width: 100,
    },
    {
      title: '出发地',
      dataIndex: 'departure',
      key: 'departure',
      width: 100,
    },
    {
      title: '目的地',
      dataIndex: 'arrival',
      key: 'arrival',
      width: 100,
    },
    {
      title: '出发日期',
      dataIndex: 'departureDate',
      key: 'departureDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '出发时间',
      dataIndex: 'departureTime',
      key: 'departureTime',
      width: 100,
    },
    {
      title: '乘车人数',
      key: 'passengerCount',
      width: 100,
      render: (record: Order) => `${record.passengers.length}人`,
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 100,
      render: (price: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{price}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: Order) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showOrderDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<PayCircleOutlined />}
                onClick={() => handlePayOrder(record.id)}
              >
                支付
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelOrder(record.id)}
              >
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="我的订单">
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane tab="全部订单" key="all" />
          <TabPane tab="待支付" key="pending" />
          <TabPane tab="已支付" key="paid" />
          <TabPane tab="已取消" key="cancelled" />
          <TabPane tab="已完成" key="completed" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredOrders()}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="订单详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions title="订单信息" bordered column={2}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="车次">{selectedOrder.trainNumber}</Descriptions.Item>
              <Descriptions.Item label="出发日期">{dayjs(selectedOrder.departureDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="出发地">{selectedOrder.departure}</Descriptions.Item>
              <Descriptions.Item label="目的地">{selectedOrder.arrival}</Descriptions.Item>
              <Descriptions.Item label="出发时间">{selectedOrder.departureTime}</Descriptions.Item>
              <Descriptions.Item label="到达时间">{selectedOrder.arrivalTime}</Descriptions.Item>
              <Descriptions.Item label="总价" span={2}>
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '16px' }}>
                  ¥{selectedOrder.totalPrice}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px' }}>
              <h3>乘车人信息</h3>
              <Table
                columns={[
                  { title: '姓名', dataIndex: 'name', key: 'name' },
                  { title: '证件号码', dataIndex: 'idCard', key: 'idCard' },
                  { 
                    title: '座位类型', 
                    dataIndex: 'seatType', 
                    key: 'seatType',
                    render: (seatType: string) => getSeatTypeText(seatType),
                  },
                  { 
                    title: '座位号', 
                    dataIndex: 'seatNumber', 
                    key: 'seatNumber',
                    render: (seatNumber: string) => seatNumber || '待分配',
                  },
                  { 
                    title: '票价', 
                    dataIndex: 'ticketPrice', 
                    key: 'ticketPrice',
                    render: (price: number) => <span style={{ color: '#ff4d4f' }}>¥{price}</span>,
                  },
                ]}
                dataSource={selectedOrder.passengers}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {selectedOrder.status === 'pending' && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PayCircleOutlined />}
                    onClick={() => {
                      handlePayOrder(selectedOrder.id);
                      setDetailVisible(false);
                    }}
                  >
                    立即支付
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      handleCancelOrder(selectedOrder.id);
                      setDetailVisible(false);
                    }}
                  >
                    取消订单
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
});

export default OrdersPage;