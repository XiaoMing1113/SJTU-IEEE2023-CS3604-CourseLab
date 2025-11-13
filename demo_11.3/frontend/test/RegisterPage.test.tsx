import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import RegisterPage from '../src/pages/RegisterPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn();

const renderRegisterPage = () => {
  return render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );
};

describe('RegisterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('renders register form with all fields', () => {
    renderRegisterPage();
    
    expect(screen.getByText('用户注册')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请确认密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入真实姓名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入身份证号')).toBeInTheDocument();
    expect(screen.getByText('发送验证码')).toBeInTheDocument();
    expect(screen.getByText('注册')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderRegisterPage();
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入手机号')).toBeInTheDocument();
      expect(screen.getByText('请输入验证码')).toBeInTheDocument();
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
      expect(screen.getByText('请确认密码')).toBeInTheDocument();
      expect(screen.getByText('请输入真实姓名')).toBeInTheDocument();
      expect(screen.getByText('请输入身份证号')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    renderRegisterPage();
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '123' } });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderRegisterPage();
    
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(passwordInput, { target: { value: '123' } });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText('密码长度至少6位')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderRegisterPage();
    
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    const confirmPasswordInput = screen.getByPlaceholderText('请确认密码');
    
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '654321' } });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument();
    });
  });

  it('validates ID card format', async () => {
    renderRegisterPage();
    
    const idCardInput = screen.getByPlaceholderText('请输入身份证号');
    fireEvent.change(idCardInput, { target: { value: '123456' } });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText('请输入正确的身份证号')).toBeInTheDocument();
    });
  });

  it('sends verification code when button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderRegisterPage();
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    const sendCodeButton = screen.getByText('发送验证码');
    fireEvent.click(sendCodeButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '13800138000',
          type: 'register',
        }),
      });
    });
  });

  it('shows countdown after sending verification code', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderRegisterPage();
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    const sendCodeButton = screen.getByText('发送验证码');
    fireEvent.click(sendCodeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/\d+s后重新发送/)).toBeInTheDocument();
    });
  });

  it('handles verification code send failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '发送失败' }),
    });

    renderRegisterPage();
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    const sendCodeButton = screen.getByText('发送验证码');
    fireEvent.click(sendCodeButton);
    
    await waitFor(() => {
      // The error message should be handled by the component
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('submits registration form with valid data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '注册成功' }),
    });

    renderRegisterPage();
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { 
      target: { value: '13800138000' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请确认密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入真实姓名'), { 
      target: { value: '张三' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入身份证号'), { 
      target: { value: '110101199001011234' } 
    });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '13800138000',
          verificationCode: '123456',
          password: '123456',
          realName: '张三',
          idCard: '110101199001011234',
        }),
      });
    });
  });

  it('navigates to login page after successful registration', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: '注册成功' }),
    });

    renderRegisterPage();
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { 
      target: { value: '13800138000' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请确认密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入真实姓名'), { 
      target: { value: '张三' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入身份证号'), { 
      target: { value: '110101199001011234' } 
    });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles registration failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '注册失败' }),
    });

    renderRegisterPage();
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText('请输入手机号'), { 
      target: { value: '13800138000' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请确认密码'), { 
      target: { value: '123456' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入真实姓名'), { 
      target: { value: '张三' } 
    });
    fireEvent.change(screen.getByPlaceholderText('请输入身份证号'), { 
      target: { value: '110101199001011234' } 
    });
    
    const registerButton = screen.getByText('注册');
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      // Should not navigate on failure
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('has link to login page', () => {
    renderRegisterPage();
    
    const loginLink = screen.getByText('已有账号？立即登录');
    expect(loginLink).toBeInTheDocument();
    
    fireEvent.click(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('disables send code button when phone is empty', () => {
    renderRegisterPage();
    
    const sendCodeButton = screen.getByText('发送验证码');
    expect(sendCodeButton).toBeDisabled();
  });

  it('enables send code button when valid phone is entered', async () => {
    renderRegisterPage();
    
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    
    await waitFor(() => {
      const sendCodeButton = screen.getByText('发送验证码');
      expect(sendCodeButton).not.toBeDisabled();
    });
  });
});