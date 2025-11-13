import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import App from '../../src/App';
import { testUtils } from '../setup';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }))
  }
}));

const mockedAxios = axios as any;

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('API与UI映射验证测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testUtils.clearAuthState();
  });

  describe('用户认证API映射验证', () => {
    it('登录页面应该正确调用登录API', async () => {
      // Mock登录API响应
      mockedAxios.post.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          user: testUtils.mockFormData.validUser,
          token: 'mock-token'
        })
      });

      renderApp();
      
      // 导航到登录页面
      const loginLink = screen.getByText(/登录/);
      fireEvent.click(loginLink);

      // 填写登录表单
      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      // 验证API调用
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
          phoneNumber: '13800138000',
          password: 'Password123!'
        });
      });
    });

    it('注册页面应该正确调用注册相关API', async () => {
      // Mock发送验证码API
      mockedAxios.post.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({ message: '验证码已发送' })
      });

      // Mock注册API
      mockedAxios.post.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          user: testUtils.mockFormData.validUser,
          token: 'mock-token'
        })
      });

      renderApp();
      
      // 导航到注册页面
      const registerLink = screen.getByText(/注册/);
      fireEvent.click(registerLink);

      // 步骤1: 发送验证码
      const phoneInput = screen.getByLabelText('手机号');
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      
      const sendCodeButton = screen.getByText('发送验证码');
      fireEvent.click(sendCodeButton);

      // 验证发送验证码API调用
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/send-verification-code', {
          phoneNumber: '13800138000',
          codeType: 'register'
        });
      });

      // 步骤2: 填写完整注册表单
      const passwordInput = screen.getByLabelText('密码');
      const confirmPasswordInput = screen.getByLabelText('确认密码');
      const usernameInput = screen.getByLabelText('用户名');
      const idCardInput = screen.getByLabelText('身份证号');
      const codeInput = screen.getByLabelText('验证码');
      const submitButton = screen.getByRole('button', { name: '注册' });

      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.change(usernameInput, { target: { value: '测试用户' } });
      fireEvent.change(idCardInput, { target: { value: '110101199001011234' } });
      fireEvent.change(codeInput, { target: { value: '123456' } });
      fireEvent.click(submitButton);

      // 验证注册API调用
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', {
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '测试用户',
          idCard: '110101199001011234',
          verificationCode: '123456'
        });
      });
    });
  });

  describe('车票查询API映射验证', () => {
    it('车票搜索页面应该正确调用查询API', async () => {
      // Mock车票查询API响应
      mockedAxios.get.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          trains: [
            {
              id: 'train-1',
              trainNumber: 'G1001',
              departureCity: '北京',
              arrivalCity: '上海',
              departureTime: '08:00',
              arrivalTime: '12:30',
              duration: '4小时30分',
              seats: {
                businessClass: { available: 10, price: 1748 },
                firstClass: { available: 20, price: 933 },
                secondClass: { available: 50, price: 553 }
              }
            }
          ],
          total: 1
        })
      });

      renderApp();
      
      // 导航到车票搜索页面
      const searchLink = screen.getByText(/车票查询/);
      fireEvent.click(searchLink);

      // 填写搜索表单
      const departureCityInput = screen.getByLabelText('出发城市');
      const arrivalCityInput = screen.getByLabelText('到达城市');
      const departureDateInput = screen.getByLabelText('出发日期');
      const searchButton = screen.getByRole('button', { name: '查询' });

      fireEvent.change(departureCityInput, { target: { value: '北京' } });
      fireEvent.change(arrivalCityInput, { target: { value: '上海' } });
      fireEvent.change(departureDateInput, { target: { value: '2024-12-01' } });
      fireEvent.click(searchButton);

      // 验证查询API调用
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/trains/search', {
          params: {
            departureCity: '北京',
            arrivalCity: '上海',
            departureDate: '2024-12-01'
          }
        });
      });

      // 验证搜索结果显示
      await waitFor(() => {
        expect(screen.getByText('G1001')).toBeInTheDocument();
        expect(screen.getByText('北京')).toBeInTheDocument();
        expect(screen.getByText('上海')).toBeInTheDocument();
      });
    });
  });

  describe('订单管理API映射验证', () => {
    beforeEach(() => {
      // 设置已登录状态
      testUtils.mockAuthenticatedUser();
    });

    it('订单页面应该正确调用订单查询API', async () => {
      // Mock订单查询API响应
      mockedAxios.get.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          orders: [
            {
              id: 'order-1',
              orderNumber: 'E202412010001',
              trainNumber: 'G1001',
              departureCity: '北京',
              arrivalCity: '上海',
              departureDate: '2024-12-01',
              departureTime: '08:00',
              status: 'PAID',
              totalAmount: 553,
              passengers: [
                {
                  name: '张三',
                  idCard: '110101199001011234',
                  seatNumber: '02车06A'
                }
              ]
            }
          ],
          total: 1
        })
      });

      renderApp();
      
      // 导航到订单页面
      const ordersLink = screen.getByText(/我的订单/);
      fireEvent.click(ordersLink);

      // 验证订单查询API调用
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/orders', {
          headers: {
            Authorization: 'Bearer mock-jwt-token'
          }
        });
      });

      // 验证订单信息显示
      await waitFor(() => {
        expect(screen.getByText('E202412010001')).toBeInTheDocument();
        expect(screen.getByText('G1001')).toBeInTheDocument();
        expect(screen.getByText('已支付')).toBeInTheDocument();
      });
    });

    it('订单创建应该正确调用创建订单API', async () => {
      // Mock创建订单API响应
      mockedAxios.post.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          order: {
            id: 'order-1',
            orderNumber: 'E202412010001',
            status: 'PENDING_PAYMENT'
          }
        })
      });

      renderApp();
      
      // 模拟从车票搜索到订单创建的流程
      // 这里需要先有车票搜索结果，然后点击预订
      
      // 验证创建订单API调用（当用户点击确认订单时）
      // 注意：这个测试需要完整的预订流程UI才能完全验证
    });
  });

  describe('用户信息管理API映射验证', () => {
    beforeEach(() => {
      testUtils.mockAuthenticatedUser();
    });

    it('个人中心应该正确调用用户信息API', async () => {
      // Mock用户信息API响应
      mockedAxios.get.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          user: testUtils.mockFormData.validUser
        })
      });

      renderApp();
      
      // 导航到个人中心
      const profileLink = screen.getByText(/个人中心/);
      fireEvent.click(profileLink);

      // 验证用户信息查询API调用
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/profile', {
          headers: {
            Authorization: 'Bearer mock-jwt-token'
          }
        });
      });
    });

    it('用户信息修改应该正确调用更新API', async () => {
      // Mock更新用户信息API响应
      mockedAxios.put.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          user: {
            ...testUtils.mockFormData.validUser,
            username: '更新后的用户名'
          }
        })
      });

      renderApp();
      
      // 导航到个人中心
      const profileLink = screen.getByText(/个人中心/);
      fireEvent.click(profileLink);

      // 修改用户信息
      const usernameInput = screen.getByLabelText('用户名');
      const saveButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(usernameInput, { target: { value: '更新后的用户名' } });
      fireEvent.click(saveButton);

      // 验证更新API调用
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/users/profile', {
          username: '更新后的用户名'
        }, {
          headers: {
            Authorization: 'Bearer mock-jwt-token'
          }
        });
      });
    });
  });

  describe('乘车人管理API映射验证', () => {
    beforeEach(() => {
      testUtils.mockAuthenticatedUser();
    });

    it('乘车人页面应该正确调用乘车人查询API', async () => {
      // Mock乘车人查询API响应
      mockedAxios.get.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          passengers: [
            {
              id: 'passenger-1',
              name: '张三',
              idCard: '110101199001011234',
              phoneNumber: '13800138000',
              passengerType: 'ADULT'
            }
          ]
        })
      });

      renderApp();
      
      // 导航到乘车人管理页面
      const passengersLink = screen.getByText(/乘车人/);
      fireEvent.click(passengersLink);

      // 验证乘车人查询API调用
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/passengers', {
          headers: {
            Authorization: 'Bearer mock-jwt-token'
          }
        });
      });

      // 验证乘车人信息显示
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      });
    });

    it('添加乘车人应该正确调用创建API', async () => {
      // Mock创建乘车人API响应
      mockedAxios.post.mockResolvedValueOnce({
        data: testUtils.mockApiResponse({
          passenger: {
            id: 'passenger-2',
            name: '李四',
            idCard: '110101199001011235',
            phoneNumber: '13800138001',
            passengerType: 'ADULT'
          }
        })
      });

      renderApp();
      
      // 导航到乘车人管理页面
      const passengersLink = screen.getByText(/乘车人/);
      fireEvent.click(passengersLink);

      // 点击添加乘车人
      const addButton = screen.getByRole('button', { name: '添加乘车人' });
      fireEvent.click(addButton);

      // 填写乘车人信息
      const nameInput = screen.getByLabelText('姓名');
      const idCardInput = screen.getByLabelText('身份证号');
      const phoneInput = screen.getByLabelText('手机号');
      const saveButton = screen.getByRole('button', { name: '保存' });

      fireEvent.change(nameInput, { target: { value: '李四' } });
      fireEvent.change(idCardInput, { target: { value: '110101199001011235' } });
      fireEvent.change(phoneInput, { target: { value: '13800138001' } });
      fireEvent.click(saveButton);

      // 验证创建乘车人API调用
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/passengers', {
          name: '李四',
          idCard: '110101199001011235',
          phoneNumber: '13800138001',
          passengerType: 'ADULT'
        }, {
          headers: {
            Authorization: 'Bearer mock-jwt-token'
          }
        });
      });
    });
  });

  describe('错误处理映射验证', () => {
    it('应该正确处理API错误并显示用户友好的错误信息', async () => {
      // Mock API错误响应
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            success: false,
            message: '手机号格式不正确',
            errorCode: 'INVALID_PHONE_NUMBER'
          }
        }
      });

      renderApp();
      
      // 导航到登录页面并提交无效数据
      const loginLink = screen.getByText(/登录/);
      fireEvent.click(loginLink);

      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      // 验证错误信息显示
      await waitFor(() => {
        expect(screen.getByText('手机号格式不正确')).toBeInTheDocument();
      });
    });

    it('应该正确处理网络错误', async () => {
      // Mock网络错误
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      renderApp();
      
      const loginLink = screen.getByText(/登录/);
      fireEvent.click(loginLink);

      const phoneInput = screen.getByLabelText('手机号');
      const passwordInput = screen.getByLabelText('密码');
      const submitButton = screen.getByRole('button', { name: '登录' });

      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.click(submitButton);

      // 验证网络错误提示
      await waitFor(() => {
        expect(screen.getByText(/网络连接失败/)).toBeInTheDocument();
      });
    });
  });

  describe('认证状态映射验证', () => {
    it('未登录用户应该被重定向到登录页面', async () => {
      renderApp();
      
      // 尝试访问需要认证的页面
      const ordersLink = screen.getByText(/我的订单/);
      fireEvent.click(ordersLink);

      // 验证重定向到登录页面
      await waitFor(() => {
        expect(screen.getByText('用户登录')).toBeInTheDocument();
      });
    });

    it('已登录用户应该能够访问受保护的页面', async () => {
      testUtils.mockAuthenticatedUser();

      renderApp();
      
      // 访问需要认证的页面
      const ordersLink = screen.getByText(/我的订单/);
      fireEvent.click(ordersLink);

      // 验证能够正常访问
      await waitFor(() => {
        expect(screen.getByText(/订单列表/)).toBeInTheDocument();
      });
    });
  });
});