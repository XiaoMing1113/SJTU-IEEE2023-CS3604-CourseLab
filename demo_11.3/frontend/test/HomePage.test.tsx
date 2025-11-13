import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import HomePage from '../src/pages/HomePage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = vi.fn(() => ({
    format: vi.fn(() => '2024-01-01'),
    startOf: vi.fn(() => mockDayjs()),
  }));
  mockDayjs.extend = vi.fn();
  return { default: mockDayjs };
});

const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  );
};

describe('HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders homepage with search form', () => {
    renderHomePage();
    
    expect(screen.getByText('车票查询')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('出发地')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('目的地')).toBeInTheDocument();
    expect(screen.getByText('查询')).toBeInTheDocument();
  });

  it('renders popular routes section', () => {
    renderHomePage();
    
    expect(screen.getByText('热门路线')).toBeInTheDocument();
    expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
    expect(screen.getByText('上海 → 广州')).toBeInTheDocument();
    expect(screen.getByText('北京 → 深圳')).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted with empty fields', async () => {
    renderHomePage();
    
    const searchButton = screen.getByText('查询');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入出发地')).toBeInTheDocument();
      expect(screen.getByText('请输入目的地')).toBeInTheDocument();
      expect(screen.getByText('请选择出发日期')).toBeInTheDocument();
    });
  });

  it('swaps departure and arrival when swap button is clicked', async () => {
    renderHomePage();
    
    const departureInput = screen.getByPlaceholderText('出发地');
    const arrivalInput = screen.getByPlaceholderText('目的地');
    const swapButton = screen.getByRole('button', { name: /swap/i });
    
    // Fill in the inputs
    fireEvent.change(departureInput, { target: { value: '北京' } });
    fireEvent.change(arrivalInput, { target: { value: '上海' } });
    
    // Click swap button
    fireEvent.click(swapButton);
    
    await waitFor(() => {
      expect(departureInput).toHaveValue('上海');
      expect(arrivalInput).toHaveValue('北京');
    });
  });

  it('navigates to search page with parameters when form is submitted', async () => {
    renderHomePage();
    
    const departureInput = screen.getByPlaceholderText('出发地');
    const arrivalInput = screen.getByPlaceholderText('目的地');
    const searchButton = screen.getByText('查询');
    
    // Fill in the form
    fireEvent.change(departureInput, { target: { value: '北京' } });
    fireEvent.change(arrivalInput, { target: { value: '上海' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search', {
        state: {
          from: '北京',
          to: '上海',
          date: '2024-01-01',
          trainType: 'all',
        },
      });
    });
  });

  it('handles popular route clicks', () => {
    renderHomePage();
    
    const popularRoute = screen.getByText('北京 → 上海');
    fireEvent.click(popularRoute);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search', {
      state: {
        from: '北京',
        to: '上海',
        date: '2024-01-01',
        trainType: 'all',
      },
    });
  });

  it('renders train type selector', () => {
    renderHomePage();
    
    expect(screen.getByText('车次类型')).toBeInTheDocument();
    // The Select component should be present
    const trainTypeSelect = screen.getByRole('combobox');
    expect(trainTypeSelect).toBeInTheDocument();
  });

  it('allows selecting different train types', async () => {
    renderHomePage();
    
    const trainTypeSelect = screen.getByRole('combobox');
    fireEvent.click(trainTypeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('高速动车')).toBeInTheDocument();
      expect(screen.getByText('动车')).toBeInTheDocument();
      expect(screen.getByText('特快')).toBeInTheDocument();
      expect(screen.getByText('快速')).toBeInTheDocument();
    });
  });

  it('updates train type when option is selected', async () => {
    renderHomePage();
    
    const trainTypeSelect = screen.getByRole('combobox');
    fireEvent.click(trainTypeSelect);
    
    await waitFor(() => {
      const highSpeedOption = screen.getByText('高速动车');
      fireEvent.click(highSpeedOption);
    });
    
    // Fill other required fields and submit
    const departureInput = screen.getByPlaceholderText('出发地');
    const arrivalInput = screen.getByPlaceholderText('目的地');
    const searchButton = screen.getByText('查询');
    
    fireEvent.change(departureInput, { target: { value: '北京' } });
    fireEvent.change(arrivalInput, { target: { value: '上海' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search', {
        state: {
          from: '北京',
          to: '上海',
          date: '2024-01-01',
          trainType: 'G',
        },
      });
    });
  });

  it('renders service features section', () => {
    renderHomePage();
    
    expect(screen.getByText('服务特色')).toBeInTheDocument();
    expect(screen.getByText('快速查询')).toBeInTheDocument();
    expect(screen.getByText('在线支付')).toBeInTheDocument();
    expect(screen.getByText('实时更新')).toBeInTheDocument();
  });

  it('handles form reset', async () => {
    renderHomePage();
    
    const departureInput = screen.getByPlaceholderText('出发地');
    const arrivalInput = screen.getByPlaceholderText('目的地');
    
    // Fill in the form
    fireEvent.change(departureInput, { target: { value: '北京' } });
    fireEvent.change(arrivalInput, { target: { value: '上海' } });
    
    // Check if values are set
    expect(departureInput).toHaveValue('北京');
    expect(arrivalInput).toHaveValue('上海');
    
    // Find and click reset button if it exists
    const form = departureInput.closest('form');
    if (form) {
      const resetButton = form.querySelector('button[type="reset"]');
      if (resetButton) {
        fireEvent.click(resetButton);
        
        await waitFor(() => {
          expect(departureInput).toHaveValue('');
          expect(arrivalInput).toHaveValue('');
        });
      }
    }
  });
});