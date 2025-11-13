import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import TicketBookingPage from '../src/pages/TicketBookingPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  state: {
    ticket: {
      trainNumber: 'G1',
      departureTime: '08:00',
      arrivalTime: '12:30',
      duration: '4h30m',
      businessSeat: { available: 10, price: 1748 },
      firstClass: { available: 20, price: 933 },
      secondClass: { available: 50, price: 553 },
    },
    seatType: 'secondClass',
    from: '北京',
    to: '上海',
    date: '2024-01-15',
  },
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
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
};

vi.mock('../src/stores/authStore', () => ({
  default: mockAuthStore,
}));

// Mock fetch
global.fetch = vi.fn();

const renderTicketBookingPage = () => {
  return render(
    <BrowserRouter>
      <TicketBookingPage />
    </BrowserRouter>
  );
};

describe('TicketBookingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('renders booking form with ticket information', () => {
    renderTicketBookingPage();
    
    expect(screen.getByText('车票预订')).toBeInTheDocument();
    expect(screen.getByText('G1')).toBeInTheDocument();
    expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 12:30')).toBeInTheDocument();
    expect(screen.getByText('4h30m')).toBeInTheDocument();
  });

  it('displays correct seat type and price', () => {
    renderTicketBookingPage();
    
    expect(screen.getByText('二等座')).toBeInTheDocument();
    expect(screen.getByText('¥553')).toBeInTheDocument();
  });

  it('loads passengers on component mount', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
      {
        id: '2',
        name: '李四',
        idCard: '110101199002022345',
        phone: '13800138001',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPassengers }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/passengers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer undefined', // Token would be undefined in test
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
    });
  });

  it('allows selecting passengers', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPassengers }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });
  });

  it('calculates total price correctly', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
      {
        id: '2',
        name: '李四',
        idCard: '110101199002022345',
        phone: '13800138001',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPassengers }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
    });

    await waitFor(() => {
      expect(screen.getByText('¥1106')).toBeInTheDocument(); // 553 * 2
    });
  });

  it('shows validation error when no passengers selected', async () => {
    renderTicketBookingPage();
    
    const submitButton = screen.getByText('提交订单');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('请选择至少一位乘车人')).toBeInTheDocument();
    });
  });

  it('submits order with selected passengers', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPassengers }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { orderId: 'ORDER123', totalPrice: 553 } 
        }),
      });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
    });

    const submitButton = screen.getByText('提交订单');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer undefined',
        },
        body: JSON.stringify({
          trainNumber: 'G1',
          from: '北京',
          to: '上海',
          date: '2024-01-15',
          departureTime: '08:00',
          arrivalTime: '12:30',
          seatType: 'secondClass',
          passengers: ['1'],
          totalPrice: 553,
        }),
      });
    });
  });

  it('navigates to orders page after successful booking', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPassengers }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { orderId: 'ORDER123', totalPrice: 553 } 
        }),
      });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
    });

    const submitButton = screen.getByText('提交订单');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  it('handles booking failure', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPassengers }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '预订失败' }),
      });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
    });

    const submitButton = screen.getByText('提交订单');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Should not navigate on failure
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during order submission', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPassengers }),
      })
      .mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

    renderTicketBookingPage();
    
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
    });

    const submitButton = screen.getByText('提交订单');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('提交中...')).toBeInTheDocument();
  });

  it('handles passengers loading failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '获取乘车人失败' }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Error should be handled by the component
    });
  });

  it('shows passenger information correctly', async () => {
    const mockPassengers = [
      {
        id: '1',
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138000',
        passengerType: 'adult',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPassengers }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      expect(screen.getByText('成人')).toBeInTheDocument();
    });
  });

  it('redirects to login if not authenticated', () => {
    // Mock unauthenticated state
    const unauthenticatedStore = {
      user: null,
      isAuthenticated: false,
    };

    vi.mocked(mockAuthStore).isAuthenticated = false;
    vi.mocked(mockAuthStore).user = null;

    renderTicketBookingPage();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows empty state when no passengers available', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      expect(screen.getByText('暂无乘车人，请先添加乘车人')).toBeInTheDocument();
    });
  });

  it('navigates to passengers page when add passenger button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    renderTicketBookingPage();
    
    await waitFor(() => {
      const addButton = screen.getByText('添加乘车人');
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/passengers');
    });
  });
});