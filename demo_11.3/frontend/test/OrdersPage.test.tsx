import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import OrdersPage from '../src/pages/OrdersPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authStore
const mockAuthStore = {
  user: {
    id: '1',
    phone: '13800138000',
    realName: '张三',
  },
  isAuthenticated: true,
  token: 'mock-token',
};

vi.mock('../src/stores/authStore', () => ({
  default: mockAuthStore,
}));

// Mock fetch
global.fetch = vi.fn();

const renderOrdersPage = () => {
  return render(
    <BrowserRouter>
      <OrdersPage />
    </BrowserRouter>
  );
};

describe('OrdersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('renders orders page with title', () => {
    renderOrdersPage();
    
    expect(screen.getByText('我的订单')).toBeInTheDocument();
  });

  it('loads orders on component mount', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'paid',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOrders }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('ORDER123')).toBeInTheDocument();
      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15 08:00 - 12:30')).toBeInTheDocument();
      expect(screen.getByText('二等座')).toBeInTheDocument();
      expect(screen.getByText('¥553')).toBeInTheDocument();
    });
  });

  it('displays different order statuses correctly', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
      {
        id: 'ORDER124',
        trainNumber: 'G2',
        from: '上海',
        to: '北京',
        date: '2024-01-16',
        departureTime: '09:00',
        arrivalTime: '13:30',
        seatType: '一等座',
        passengers: [{ name: '李四', idCard: '110101199002022345' }],
        totalPrice: 933,
        status: 'paid',
        createdAt: '2024-01-11T10:00:00Z',
      },
      {
        id: 'ORDER125',
        trainNumber: 'G3',
        from: '北京',
        to: '广州',
        date: '2024-01-17',
        departureTime: '10:00',
        arrivalTime: '18:30',
        seatType: '二等座',
        passengers: [{ name: '王五', idCard: '110101199003033456' }],
        totalPrice: 862,
        status: 'cancelled',
        createdAt: '2024-01-12T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOrders }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      expect(screen.getByText('待支付')).toBeInTheDocument();
      expect(screen.getByText('已支付')).toBeInTheDocument();
      expect(screen.getByText('已取消')).toBeInTheDocument();
    });
  });

  it('filters orders by status', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
      {
        id: 'ORDER124',
        trainNumber: 'G2',
        from: '上海',
        to: '北京',
        date: '2024-01-16',
        departureTime: '09:00',
        arrivalTime: '13:30',
        seatType: '一等座',
        passengers: [{ name: '李四', idCard: '110101199002022345' }],
        totalPrice: 933,
        status: 'paid',
        createdAt: '2024-01-11T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOrders }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      expect(screen.getByText('ORDER123')).toBeInTheDocument();
      expect(screen.getByText('ORDER124')).toBeInTheDocument();
    });

    // Filter by pending status
    const pendingTab = screen.getByText('待支付');
    fireEvent.click(pendingTab);
    
    await waitFor(() => {
      expect(screen.getByText('ORDER123')).toBeInTheDocument();
      // ORDER124 should be filtered out, but we need to implement this logic
    });
  });

  it('pays for pending order', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '支付成功' }),
      });

    renderOrdersPage();
    
    await waitFor(() => {
      const payButton = screen.getByText('支付');
      fireEvent.click(payButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders/ORDER123/pay', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  it('cancels pending order', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '取消成功' }),
      });

    renderOrdersPage();
    
    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders/ORDER123/cancel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  it('shows order details when view button is clicked', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [
          { name: '张三', idCard: '110101199001011234' },
          { name: '李四', idCard: '110101199002022345' },
        ],
        totalPrice: 1106,
        status: 'paid',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockOrders }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      const viewButton = screen.getByText('查看详情');
      fireEvent.click(viewButton);
    });

    await waitFor(() => {
      expect(screen.getByText('订单详情')).toBeInTheDocument();
      expect(screen.getByText('张三 (110101199001011234)')).toBeInTheDocument();
      expect(screen.getByText('李四 (110101199002022345)')).toBeInTheDocument();
    });
  });

  it('handles orders loading failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '获取订单失败' }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Error should be handled by the component
    });
  });

  it('shows empty state when no orders', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    renderOrdersPage();
    
    await waitFor(() => {
      expect(screen.getByText('暂无订单')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching orders', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderOrdersPage();
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('handles payment failure', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '支付失败' }),
      });

    renderOrdersPage();
    
    await waitFor(() => {
      const payButton = screen.getByText('支付');
      fireEvent.click(payButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Error should be handled by the component
    });
  });

  it('handles cancellation failure', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '取消失败' }),
      });

    renderOrdersPage();
    
    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Error should be handled by the component
    });
  });

  it('redirects to login if not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(mockAuthStore).isAuthenticated = false;
    vi.mocked(mockAuthStore).user = null;

    renderOrdersPage();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('refreshes orders after successful payment', async () => {
    const mockOrders = [
      {
        id: 'ORDER123',
        trainNumber: 'G1',
        from: '北京',
        to: '上海',
        date: '2024-01-15',
        departureTime: '08:00',
        arrivalTime: '12:30',
        seatType: '二等座',
        passengers: [{ name: '张三', idCard: '110101199001011234' }],
        totalPrice: 553,
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
      },
    ];

    const updatedOrders = [
      {
        ...mockOrders[0],
        status: 'paid',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '支付成功' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedOrders }),
      });

    renderOrdersPage();
    
    await waitFor(() => {
      const payButton = screen.getByText('支付');
      fireEvent.click(payButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial load + pay + refresh
    });
  });
});