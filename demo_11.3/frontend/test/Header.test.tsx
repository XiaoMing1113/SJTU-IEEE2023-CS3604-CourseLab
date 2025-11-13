import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Header from '../src/components/Layout/Header';
import { authStore } from '../src/stores/authStore';

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
vi.mock('../src/stores/authStore', () => ({
  authStore: {
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  },
}));

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset authStore state
    authStore.isAuthenticated = false;
    authStore.user = null;
  });

  it('renders header with logo and navigation', () => {
    renderHeader();
    
    expect(screen.getByText('12306购票系统')).toBeInTheDocument();
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('车票查询')).toBeInTheDocument();
  });

  it('shows login and register buttons when not authenticated', () => {
    renderHeader();
    
    expect(screen.getByText('登录')).toBeInTheDocument();
    expect(screen.getByText('注册')).toBeInTheDocument();
  });

  it('shows user menu when authenticated', () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.queryByText('登录')).not.toBeInTheDocument();
    expect(screen.queryByText('注册')).not.toBeInTheDocument();
  });

  it('navigates to login page when login button is clicked', () => {
    renderHeader();
    
    const loginButton = screen.getByText('登录');
    fireEvent.click(loginButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to register page when register button is clicked', () => {
    renderHeader();
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('navigates to home page when logo is clicked', () => {
    renderHeader();
    
    const logo = screen.getByText('12306购票系统');
    fireEvent.click(logo);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to search page when search menu is clicked', () => {
    renderHeader();
    
    const searchMenu = screen.getByText('车票查询');
    fireEvent.click(searchMenu);
    
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('shows user avatar when user has avatar', () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: 'https://example.com/avatar.jpg',
    };

    renderHeader();
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('calls logout when logout menu item is clicked', async () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    // Click on user dropdown
    const userDropdown = screen.getByText('张三');
    fireEvent.click(userDropdown);
    
    // Wait for dropdown menu to appear and click logout
    await waitFor(() => {
      const logoutItem = screen.getByText('退出登录');
      fireEvent.click(logoutItem);
    });
    
    expect(authStore.logout).toHaveBeenCalled();
  });

  it('shows authenticated menu items when user is logged in', async () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    // Click on user dropdown
    const userDropdown = screen.getByText('张三');
    fireEvent.click(userDropdown);
    
    // Check if authenticated menu items are present
    await waitFor(() => {
      expect(screen.getByText('我的订单')).toBeInTheDocument();
      expect(screen.getByText('个人资料')).toBeInTheDocument();
      expect(screen.getByText('乘车人管理')).toBeInTheDocument();
      expect(screen.getByText('退出登录')).toBeInTheDocument();
    });
  });

  it('navigates to orders page when orders menu is clicked', async () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    // Click on user dropdown
    const userDropdown = screen.getByText('张三');
    fireEvent.click(userDropdown);
    
    // Click on orders menu item
    await waitFor(() => {
      const ordersItem = screen.getByText('我的订单');
      fireEvent.click(ordersItem);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  it('navigates to profile page when profile menu is clicked', async () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    // Click on user dropdown
    const userDropdown = screen.getByText('张三');
    fireEvent.click(userDropdown);
    
    // Click on profile menu item
    await waitFor(() => {
      const profileItem = screen.getByText('个人资料');
      fireEvent.click(profileItem);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to passengers page when passengers menu is clicked', async () => {
    authStore.isAuthenticated = true;
    authStore.user = {
      id: '1',
      phone: '13800138000',
      realName: '张三',
      avatar: null,
    };

    renderHeader();
    
    // Click on user dropdown
    const userDropdown = screen.getByText('张三');
    fireEvent.click(userDropdown);
    
    // Click on passengers menu item
    await waitFor(() => {
      const passengersItem = screen.getByText('乘车人管理');
      fireEvent.click(passengersItem);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/passengers');
  });
});