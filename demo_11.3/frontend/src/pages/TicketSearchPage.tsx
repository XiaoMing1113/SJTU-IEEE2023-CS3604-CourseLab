import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, DatePicker, Select, Table, Tag, Space, message } from 'antd';
import { SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

interface Train {
  id: string;
  trainNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  businessSeat: number;
  firstClassSeat: number;
  secondClassSeat: number;
  businessPrice: number;
  firstClassPrice: number;
  secondClassPrice: number;
}

const TicketSearchPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<Train[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // 从URL参数或location state获取搜索条件
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from') || location.state?.from;
    const to = searchParams.get('to') || location.state?.to;
    const date = searchParams.get('date') || location.state?.date;

    if (from || to || date) {
      form.setFieldsValue({
        departure: from,
        arrival: to,
        departureDate: date ? dayjs(date) : undefined,
      });
      
      if (from && to && date) {
        handleSearch({ departure: from, arrival: to, departureDate: dayjs(date) });
      }
    }
  }, [location, form]);

  const handleSearch = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 调用API搜索车次
      const response = await fetch(`/api/trains/search?from=${values.departure}&to=${values.arrival}&date=${values.departureDate.format('YYYY-MM-DD')}`);
      const data = await response.json();
      
      if (response.ok) {
        setTrains(data.trains || []);
      } else {
        message.error(data.message || '搜索失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapStations = () => {
    const departure = form.getFieldValue('departure');
    const arrival = form.getFieldValue('arrival');
    form.setFieldsValue({
      departure: arrival,
      arrival: departure,
    });
  };

  const handleBookTicket = (train: Train) => {
    navigate('/booking', { state: { train, searchParams: form.getFieldsValue() } });
  };

  const columns = [
    {
      title: '车次',
      dataIndex: 'trainNumber',
      key: 'trainNumber',
      width: 100,
    },
    {
      title: '出发站',
      dataIndex: 'departure',
      key: 'departure',
      width: 100,
    },
    {
      title: '到达站',
      dataIndex: 'arrival',
      key: 'arrival',
      width: 100,
    },
    {
      title: '出发时间',
      dataIndex: 'departureTime',
      key: 'departureTime',
      width: 100,
    },
    {
      title: '到达时间',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      width: 100,
    },
    {
      title: '历时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
    },
    {
      title: '商务座',
      key: 'businessSeat',
      width: 120,
      render: (record: Train) => (
        <div>
          <div>{record.businessSeat > 0 ? record.businessSeat : '无'}</div>
          <div style={{ color: '#ff4d4f' }}>¥{record.businessPrice}</div>
        </div>
      ),
    },
    {
      title: '一等座',
      key: 'firstClassSeat',
      width: 120,
      render: (record: Train) => (
        <div>
          <div>{record.firstClassSeat > 0 ? record.firstClassSeat : '无'}</div>
          <div style={{ color: '#ff4d4f' }}>¥{record.firstClassPrice}</div>
        </div>
      ),
    },
    {
      title: '二等座',
      key: 'secondClassSeat',
      width: 120,
      render: (record: Train) => (
        <div>
          <div>{record.secondClassSeat > 0 ? record.secondClassSeat : '无'}</div>
          <div style={{ color: '#ff4d4f' }}>¥{record.secondClassPrice}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (record: Train) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => handleBookTicket(record)}
          disabled={record.businessSeat + record.firstClassSeat + record.secondClassSeat === 0}
        >
          预订
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="车票查询" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: '16px' }}
        >
          <Form.Item
            name="departure"
            rules={[{ required: true, message: '请输入出发地' }]}
          >
            <Input placeholder="出发地" style={{ width: 120 }} />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="text" 
              icon={<SwapOutlined />} 
              onClick={handleSwapStations}
              style={{ padding: '4px 8px' }}
            />
          </Form.Item>
          
          <Form.Item
            name="arrival"
            rules={[{ required: true, message: '请输入目的地' }]}
          >
            <Input placeholder="目的地" style={{ width: 120 }} />
          </Form.Item>
          
          <Form.Item
            name="departureDate"
            rules={[{ required: true, message: '请选择出发日期' }]}
          >
            <DatePicker 
              placeholder="出发日期"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {trains.length > 0 && (
        <Card title="查询结果">
          <Table
            columns={columns}
            dataSource={trains}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}
    </div>
  );
};

export default TicketSearchPage;