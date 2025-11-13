import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PassengersPage from '../src/pages/PassengersPage';

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

const renderPassengersPage = () => {
  return render(
    <BrowserRouter>
      <PassengersPage />
    </BrowserRouter>
  );
};

describe('PassengersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('renders passengers page with title', () => {
    renderPassengersPage();
    
    expect(screen.getByText('乘车人管理')).toBeInTheDocument();
    expect(screen.getByText('添加乘车人')).toBeInTheDocument();
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

    renderPassengersPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/passengers', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      expect(screen.getByText('110101199002022345')).toBeInTheDocument();
    });
  });

  it('shows add passenger modal when add button is clicked', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('添加乘车人', { selector: '.ant-modal-title' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入身份证号')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    });
  });

  it('validates add passenger form', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('请输入姓名')).toBeInTheDocument();
      expect(screen.getByText('请输入身份证号')).toBeInTheDocument();
      expect(screen.getByText('请输入手机号')).toBeInTheDocument();
    });
  });

  it('validates ID card format', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const idCardInput = screen.getByPlaceholderText('请输入身份证号');
      fireEvent.change(idCardInput, { target: { value: '123456' } });
      
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('请输入正确的身份证号')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      fireEvent.change(phoneInput, { target: { value: '123' } });
      
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
    });
  });

  it('adds passenger successfully', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: {
            id: '3',
            name: '王五',
            idCard: '110101199003033456',
            phone: '13800138002',
            passengerType: 'adult',
          }
        }),
      });

    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      const idCardInput = screen.getByPlaceholderText('请输入身份证号');
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      
      fireEvent.change(nameInput, { target: { value: '王五' } });
      fireEvent.change(idCardInput, { target: { value: '110101199003033456' } });
      fireEvent.change(phoneInput, { target: { value: '13800138002' } });
      
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/passengers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          name: '王五',
          idCard: '110101199003033456',
          phone: '13800138002',
          passengerType: 'adult',
        }),
      });
    });
  });

  it('handles add passenger failure', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: '添加失败' }),
      });

    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      const idCardInput = screen.getByPlaceholderText('请输入身份证号');
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      
      fireEvent.change(nameInput, { target: { value: '王五' } });
      fireEvent.change(idCardInput, { target: { value: '110101199003033456' } });
      fireEvent.change(phoneInput, { target: { value: '13800138002' } });
      
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Error should be handled by the component
    });
  });

  it('shows edit passenger modal when edit button is clicked', async () => {
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

    renderPassengersPage();
    
    await waitFor(() => {
      const editButton = screen.getByText('编辑');
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByText('编辑乘车人', { selector: '.ant-modal-title' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('张三')).toBeInTheDocument();
      expect(screen.getByDisplayValue('110101199001011234')).toBeInTheDocument();
      expect(screen.getByDisplayValue('13800138000')).toBeInTheDocument();
    });
  });

  it('updates passenger successfully', async () => {
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
          data: {
            id: '1',
            name: '张三丰',
            idCard: '110101199001011234',
            phone: '13800138000',
            passengerType: 'adult',
          }
        }),
      });

    renderPassengersPage();
    
    await waitFor(() => {
      const editButton = screen.getByText('编辑');
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('张三');
      fireEvent.change(nameInput, { target: { value: '张三丰' } });
      
      const confirmButton = screen.getByText('确定');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/passengers/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          name: '张三丰',
          idCard: '110101199001011234',
          phone: '13800138000',
          passengerType: 'adult',
        }),
      });
    });
  });

  it('deletes passenger successfully', async () => {
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
        json: async () => ({ success: true, message: '删除成功' }),
      });

    renderPassengersPage();
    
    await waitFor(() => {
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
    });

    // Confirm deletion in modal
    await waitFor(() => {
      const confirmButton = screen.getByText('确定', { selector: '.ant-btn-primary' });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/passengers/1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  it('handles delete passenger failure', async () => {
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
        json: async () => ({ message: '删除失败' }),
      });

    renderPassengersPage();
    
    await waitFor(() => {
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      const confirmButton = screen.getByText('确定', { selector: '.ant-btn-primary' });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Error should be handled by the component
    });
  });

  it('shows empty state when no passengers', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    renderPassengersPage();
    
    await waitFor(() => {
      expect(screen.getByText('暂无乘车人')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching passengers', async () => {
    (global.fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    renderPassengersPage();
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('handles passengers loading failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '获取乘车人失败' }),
    });

    renderPassengersPage();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Error should be handled by the component
    });
  });

  it('displays passenger types correctly', async () => {
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
        name: '小明',
        idCard: '110101201001011234',
        phone: '13800138001',
        passengerType: 'child',
      },
      {
        id: '3',
        name: '老王',
        idCard: '110101195001011234',
        phone: '13800138002',
        passengerType: 'senior',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPassengers }),
    });

    renderPassengersPage();
    
    await waitFor(() => {
      expect(screen.getByText('成人')).toBeInTheDocument();
      expect(screen.getByText('儿童')).toBeInTheDocument();
      expect(screen.getByText('老人')).toBeInTheDocument();
    });
  });

  it('allows selecting passenger type when adding', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const passengerTypeSelect = screen.getByDisplayValue('成人');
      fireEvent.click(passengerTypeSelect);
    });

    await waitFor(() => {
      expect(screen.getByText('儿童')).toBeInTheDocument();
      expect(screen.getByText('老人')).toBeInTheDocument();
    });
  });

  it('refreshes passenger list after successful operations', async () => {
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
        json: async () => ({ success: true, message: '删除成功' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    renderPassengersPage();
    
    await waitFor(() => {
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      const confirmButton = screen.getByText('确定', { selector: '.ant-btn-primary' });
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial load + delete + refresh
    });
  });

  it('redirects to login if not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(mockAuthStore).isAuthenticated = false;
    vi.mocked(mockAuthStore).user = null;

    renderPassengersPage();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('cancels add/edit operations', async () => {
    renderPassengersPage();
    
    const addButton = screen.getByText('添加乘车人');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('添加乘车人', { selector: '.ant-modal-title' })).not.toBeInTheDocument();
    });
  });

  it('shows confirmation dialog before deleting passenger', async () => {
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

    renderPassengersPage();
    
    await waitFor(() => {
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
      expect(screen.getByText('确定要删除这个乘车人吗？')).toBeInTheDocument();
    });
  });
});