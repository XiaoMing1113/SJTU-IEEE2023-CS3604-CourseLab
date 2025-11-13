import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// 全局测试设置
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });

  // Mock console methods for cleaner test output
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// 测试工具函数
export const testUtils = {
  // 模拟用户登录状态
  mockAuthenticatedUser: () => {
    const mockUser = {
      id: 'user-123',
      phoneNumber: '13800138000',
      username: '测试用户',
      idCard: '110101199001011234'
    };
    
    const mockToken = 'mock-jwt-token';
    
    // 设置localStorage中的用户信息
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false
      },
      version: 0
    }));
    
    return { user: mockUser, token: mockToken };
  },

  // 清除用户登录状态
  clearAuthState: () => {
    window.localStorage.removeItem('auth-storage');
  },

  // 模拟API响应
  mockApiResponse: (data: any, success = true) => ({
    success,
    data,
    message: success ? '操作成功' : '操作失败'
  }),

  // 模拟网络错误
  mockNetworkError: () => {
    throw new Error('Network Error');
  },

  // 等待异步操作完成
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // 模拟表单输入
  mockFormData: {
    validUser: {
      phoneNumber: '13800138000',
      password: 'Password123!',
      username: '测试用户',
      idCard: '110101199001011234'
    },
    validLogin: {
      phoneNumber: '13800138000',
      password: 'Password123!'
    },
    validTicketSearch: {
      departureCity: '北京',
      arrivalCity: '上海',
      departureDate: '2024-12-01'
    }
  }
};