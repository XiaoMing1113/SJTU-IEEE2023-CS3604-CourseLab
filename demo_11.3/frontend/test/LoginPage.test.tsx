import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from '../src/pages/LoginPage';
import { testUtils } from './setup';

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
const mockLogin = vi.fn();
const mockAuthStore = {
  login: mockLogin,
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null
};

vi.mock('../src/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
    }))
  }
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.clearAuthState();
  });

  describe('页面渲染', () => {
    it('应该正确渲染登录表单', () => {
      renderLoginPage();
      
      // 验证页面标题
      expect(screen.getByText('用户登录')).toBeInTheDocument();
      
      // 验证表单字段
      expect(screen.getByLabelText('手机号')).toBeInTheDocument();
      expect(screen.getByLabelText('密码')).toBeInTheDocument();
      
      // 验证按钮
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
      
      // 验证链接
      expect(screen.getByText('还没有账号？立即注册')).toBeInTheDocument();
    });

    it('应该显示12306品牌元素', () => {
      renderLoginPage();
      
      // 验证页面包含12306相关元素
      expect(screen.getByText(/12306/)).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('应该验证手机号格式', async () => {
      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 输入无效手机号
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByText(/请输入正确的手机号/)).toBeInTheDocument();
      });
    });

    it('应该验证密码不能为空', async () => {
      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 输入有效手机号但密码为空
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.click(submitButton);
      
      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByText(/请输入密码/)).toBeInTheDocument();
      });
    });

    it('应该验证所有必填字段', async () => {
      renderLoginPage();
      
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 直接点击提交按钮
      fireEvent.click(submitButton);
      
      // 验证必填字段提示
      await waitFor(() => {
        expect(screen.getByText(/请输入手机号/)).toBeInTheDocument();
        expect(screen.getByText(/请输入密码/)).toBeInTheDocument();
      });
    });
  });

  describe('登录功能', () => {
    it('应该成功提交有效的登录表单', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        data: {
          user: testUtils.mockFormData.validUser,
          token: 'mock-token'
        }
      });

      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 填写表单
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      // 提交表单
      fireEvent.click(submitButton);
      
      // 验证调用了登录函数
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('13800138000', 'Password123!');
      });
    });

    it('应该处理登录失败情况', async () => {
      mockLogin.mockRejectedValueOnce(new Error('登录失败'));

      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 填写表单
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });
      
      // 提交表单
      fireEvent.click(submitButton);
      
      // 验证显示错误信息
      await waitFor(() => {
        expect(screen.getByText(/登录失败/)).toBeInTheDocument();
      });
    });

    it('应该在登录成功后跳转到首页', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        data: {
          user: testUtils.mockFormData.validUser,
          token: 'mock-token'
        }
      });

      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 填写并提交表单
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);
      
      // 验证跳转到首页
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('加载状态', () => {
    it('应该在登录过程中显示加载状态', async () => {
      // 模拟加载状态
      mockAuthStore.isLoading = true;
      
      renderLoginPage();
      
      const submitButton = screen.getByRole('button', { name: /登录/ });
      
      // 验证按钮显示加载状态
      expect(submitButton).toBeDisabled();
    });
  });

  describe('导航功能', () => {
    it('应该能够导航到注册页面', () => {
      renderLoginPage();
      
      const registerLink = screen.getByText('还没有账号？立即注册');
      fireEvent.click(registerLink);
      
      // 验证导航到注册页面
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });

  describe('用户体验', () => {
    it('应该支持回车键提交表单', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        data: {
          user: testUtils.mockFormData.validUser,
          token: 'mock-token'
        }
      });

      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      
      // 填写表单
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      // 按回车键
      fireEvent.keyPress(passwordInput, { key: 'Enter', code: 'Enter' });
      
      // 验证调用了登录函数
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('应该在输入时清除之前的错误信息', async () => {
      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 先触发验证错误
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/请输入手机号/)).toBeInTheDocument();
      });
      
      // 输入内容
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      
      // 验证错误信息被清除
      await waitFor(() => {
        expect(screen.queryByText(/请输入手机号/)).not.toBeInTheDocument();
      });
    });
  });

  describe('安全性', () => {
    it('应该不显示密码明文', () => {
      renderLoginPage();
      
      const passwordInput = screen.getByLabelText('密码') as HTMLInputElement;
      
      // 验证密码输入框类型为password
      expect(passwordInput.type).toBe('password');
    });

    it('应该防止表单重复提交', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      renderLoginPage();
      
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });
      
      // 填写表单
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      
      // 快速点击两次提交按钮
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      
      // 验证只调用了一次登录函数
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });
});