import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import { testUtils } from '../setup';

// Mock modules
vi.mock('../../src/services/api', () => ({
  authApi: {
    sendVerificationCode: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    resetPassword: vi.fn(),
  },
  ticketApi: {
    searchTrains: vi.fn(),
    getTrainDetail: vi.fn(),
    checkSeatAvailability: vi.fn(),
  },
  orderApi: {
    createOrder: vi.fn(),
    getOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    cancelOrder: vi.fn(),
    changeTicket: vi.fn(),
    refundTicket: vi.fn(),
  },
  userApi: {
    getUserInfo: vi.fn(),
    updateUserInfo: vi.fn(),
    changePassword: vi.fn(),
    uploadAvatar: vi.fn(),
  },
  passengerApi: {
    getPassengers: vi.fn(),
    addPassenger: vi.fn(),
    updatePassenger: vi.fn(),
    deletePassenger: vi.fn(),
  },
}));

vi.mock('../../src/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    setLoading: vi.fn(),
  })),
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('用户完整流程集成测试', () => {
  beforeEach(() => {
    testUtils.clearAuth();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('新用户注册到购票完整流程', () => {
    it('应该完成从注册到购票的完整用户旅程', async () => {
      const { authApi, ticketApi, orderApi, passengerApi } = await import('../../src/services/api');
      const { useAuthStore } = await import('../../src/stores/authStore');

      // Mock API responses
      authApi.sendVerificationCode.mockResolvedValue({ success: true });
      authApi.register.mockResolvedValue({
        success: true,
        data: {
          user: { id: '1', phone: '13800138000', username: '测试用户' },
          token: 'mock-token'
        }
      });

      ticketApi.searchTrains.mockResolvedValue({
        success: true,
        data: {
          trains: [
            {
              trainNumber: 'G1001',
              departureStation: '北京南',
              arrivalStation: '上海虹桥',
              departureTime: '08:00',
              arrivalTime: '12:30',
              duration: '4h30m',
              seats: {
                secondClass: { available: 99, price: 553 },
                firstClass: { available: 20, price: 933 }
              }
            }
          ]
        }
      });

      passengerApi.addPassenger.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          name: '张三',
          idCard: '110101199001011234',
          phone: '13800138001',
          type: 'ADULT'
        }
      });

      orderApi.createOrder.mockResolvedValue({
        success: true,
        data: {
          orderId: 'ORDER123',
          status: 'PENDING_PAYMENT',
          totalAmount: 553
        }
      });

      // Mock auth store
      const mockAuthStore = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn().mockImplementation(() => {
          mockAuthStore.isAuthenticated = true;
          mockAuthStore.user = { id: '1', phone: '13800138000', username: '测试用户' };
          mockAuthStore.token = 'mock-token';
        }),
        register: vi.fn().mockImplementation(() => {
          mockAuthStore.isAuthenticated = true;
          mockAuthStore.user = { id: '1', phone: '13800138000', username: '测试用户' };
          mockAuthStore.token = 'mock-token';
        }),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      renderApp();

      // 步骤1: 用户注册
      const registerLink = screen.getByText('注册');
      fireEvent.click(registerLink);

      await waitFor(() => {
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });

      // 填写注册表单
      fireEvent.change(screen.getByTestId('phone-input'), {
        target: { value: '13800138000' }
      });
      fireEvent.change(screen.getByTestId('username-input'), {
        target: { value: '测试用户' }
      });
      fireEvent.change(screen.getByTestId('idcard-input'), {
        target: { value: '110101199001011234' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'Password123!' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'Password123!' }
      });

      // 发送验证码
      const sendCodeButton = screen.getByTestId('send-code-button');
      fireEvent.click(sendCodeButton);

      await waitFor(() => {
        expect(authApi.sendVerificationCode).toHaveBeenCalledWith('13800138000');
      });

      // 填写验证码
      fireEvent.change(screen.getByTestId('verification-code-input'), {
        target: { value: '123456' }
      });

      // 提交注册
      const registerButton = screen.getByTestId('register-button');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          phone: '13800138000',
          username: '测试用户',
          idCard: '110101199001011234',
          password: 'Password123!',
          verificationCode: '123456'
        });
      });

      // 步骤2: 查询车票
      await waitFor(() => {
        expect(screen.getByText('车票查询')).toBeInTheDocument();
      });

      const searchLink = screen.getByText('车票查询');
      fireEvent.click(searchLink);

      await waitFor(() => {
        expect(screen.getByTestId('departure-city-input')).toBeInTheDocument();
      });

      // 填写查询条件
      fireEvent.change(screen.getByTestId('departure-city-input'), {
        target: { value: '北京' }
      });
      fireEvent.change(screen.getByTestId('arrival-city-input'), {
        target: { value: '上海' }
      });
      fireEvent.change(screen.getByTestId('departure-date-input'), {
        target: { value: '2024-12-01' }
      });

      // 执行搜索
      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(ticketApi.searchTrains).toHaveBeenCalledWith({
          departureCity: '北京',
          arrivalCity: '上海',
          departureDate: '2024-12-01'
        });
      });

      // 验证搜索结果显示
      await waitFor(() => {
        expect(screen.getByText('G1001')).toBeInTheDocument();
        expect(screen.getByText('北京南')).toBeInTheDocument();
        expect(screen.getByText('上海虹桥')).toBeInTheDocument();
      });

      // 步骤3: 预订车票
      const bookButton = screen.getByTestId('book-button-G1001');
      fireEvent.click(bookButton);

      await waitFor(() => {
        expect(screen.getByTestId('seat-type-second-class')).toBeInTheDocument();
      });

      // 选择座位类型
      const seatTypeButton = screen.getByTestId('seat-type-second-class');
      fireEvent.click(seatTypeButton);

      // 步骤4: 添加乘车人
      const addPassengerButton = screen.getByTestId('add-passenger-button');
      fireEvent.click(addPassengerButton);

      await waitFor(() => {
        expect(screen.getByTestId('passenger-name-input')).toBeInTheDocument();
      });

      // 填写乘车人信息
      fireEvent.change(screen.getByTestId('passenger-name-input'), {
        target: { value: '张三' }
      });
      fireEvent.change(screen.getByTestId('passenger-idcard-input'), {
        target: { value: '110101199001011234' }
      });
      fireEvent.change(screen.getByTestId('passenger-phone-input'), {
        target: { value: '13800138001' }
      });

      // 保存乘车人
      const savePassengerButton = screen.getByTestId('save-passenger-button');
      fireEvent.click(savePassengerButton);

      await waitFor(() => {
        expect(passengerApi.addPassenger).toHaveBeenCalledWith({
          name: '张三',
          idCard: '110101199001011234',
          phone: '13800138001',
          type: 'ADULT'
        });
      });

      // 步骤5: 确认订单
      const confirmOrderButton = screen.getByTestId('confirm-order-button');
      fireEvent.click(confirmOrderButton);

      await waitFor(() => {
        expect(screen.getByTestId('order-summary')).toBeInTheDocument();
      });

      // 提交订单
      const submitOrderButton = screen.getByTestId('submit-order-button');
      fireEvent.click(submitOrderButton);

      await waitFor(() => {
        expect(orderApi.createOrder).toHaveBeenCalledWith({
          trainNumber: 'G1001',
          departureDate: '2024-12-01',
          seatType: 'SECOND_CLASS',
          passengers: [
            {
              name: '张三',
              idCard: '110101199001011234',
              phone: '13800138001',
              type: 'ADULT'
            }
          ]
        });
      });

      // 验证订单创建成功
      await waitFor(() => {
        expect(screen.getByText('订单创建成功')).toBeInTheDocument();
        expect(screen.getByText('ORDER123')).toBeInTheDocument();
      });
    });
  });

  describe('已登录用户的快速购票流程', () => {
    it('应该支持已登录用户的快速购票', async () => {
      const { ticketApi, orderApi } = await import('../../src/services/api');
      const { useAuthStore } = await import('../../src/stores/authStore');

      // Mock authenticated user
      const mockAuthStore = {
        user: { id: '1', phone: '13800138000', username: '测试用户' },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      // Mock API responses
      ticketApi.searchTrains.mockResolvedValue({
        success: true,
        data: {
          trains: [
            {
              trainNumber: 'G1001',
              departureStation: '北京南',
              arrivalStation: '上海虹桥',
              departureTime: '08:00',
              arrivalTime: '12:30',
              duration: '4h30m',
              seats: {
                secondClass: { available: 99, price: 553 }
              }
            }
          ]
        }
      });

      orderApi.createOrder.mockResolvedValue({
        success: true,
        data: {
          orderId: 'ORDER124',
          status: 'PENDING_PAYMENT',
          totalAmount: 553
        }
      });

      renderApp();

      // 验证用户已登录
      await waitFor(() => {
        expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
      });

      // 使用首页快速搜索
      fireEvent.change(screen.getByTestId('quick-departure-input'), {
        target: { value: '北京' }
      });
      fireEvent.change(screen.getByTestId('quick-arrival-input'), {
        target: { value: '上海' }
      });
      fireEvent.change(screen.getByTestId('quick-date-input'), {
        target: { value: '2024-12-01' }
      });

      const quickSearchButton = screen.getByTestId('quick-search-button');
      fireEvent.click(quickSearchButton);

      await waitFor(() => {
        expect(ticketApi.searchTrains).toHaveBeenCalled();
      });

      // 快速预订
      await waitFor(() => {
        expect(screen.getByTestId('quick-book-button-G1001')).toBeInTheDocument();
      });

      const quickBookButton = screen.getByTestId('quick-book-button-G1001');
      fireEvent.click(quickBookButton);

      // 选择已保存的乘车人
      await waitFor(() => {
        expect(screen.getByTestId('saved-passenger-张三')).toBeInTheDocument();
      });

      const savedPassengerButton = screen.getByTestId('saved-passenger-张三');
      fireEvent.click(savedPassengerButton);

      // 快速确认
      const quickConfirmButton = screen.getByTestId('quick-confirm-button');
      fireEvent.click(quickConfirmButton);

      await waitFor(() => {
        expect(orderApi.createOrder).toHaveBeenCalled();
        expect(screen.getByText('订单创建成功')).toBeInTheDocument();
      });
    });
  });

  describe('订单管理流程', () => {
    it('应该支持完整的订单管理功能', async () => {
      const { orderApi } = await import('../../src/services/api');
      const { useAuthStore } = await import('../../src/stores/authStore');

      // Mock authenticated user
      const mockAuthStore = {
        user: { id: '1', phone: '13800138000', username: '测试用户' },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      // Mock API responses
      orderApi.getOrders.mockResolvedValue({
        success: true,
        data: {
          orders: [
            {
              id: 'ORDER123',
              trainNumber: 'G1001',
              departureStation: '北京南',
              arrivalStation: '上海虹桥',
              departureDate: '2024-12-01',
              status: 'PAID',
              totalAmount: 553,
              passengers: [
                { name: '张三', idCard: '110101199001011234' }
              ]
            }
          ]
        }
      });

      orderApi.getOrderDetail.mockResolvedValue({
        success: true,
        data: {
          id: 'ORDER123',
          trainNumber: 'G1001',
          departureStation: '北京南',
          arrivalStation: '上海虹桥',
          departureDate: '2024-12-01',
          status: 'PAID',
          totalAmount: 553,
          passengers: [
            { name: '张三', idCard: '110101199001011234', seatNumber: '02A' }
          ]
        }
      });

      orderApi.changeTicket.mockResolvedValue({
        success: true,
        data: { message: '改签成功' }
      });

      orderApi.refundTicket.mockResolvedValue({
        success: true,
        data: { message: '退票成功' }
      });

      renderApp();

      // 进入订单页面
      const ordersLink = screen.getByText('我的订单');
      fireEvent.click(ordersLink);

      await waitFor(() => {
        expect(orderApi.getOrders).toHaveBeenCalled();
        expect(screen.getByTestId('order-list')).toBeInTheDocument();
      });

      // 查看订单详情
      const orderItem = screen.getByTestId('order-item');
      fireEvent.click(orderItem);

      await waitFor(() => {
        expect(orderApi.getOrderDetail).toHaveBeenCalledWith('ORDER123');
        expect(screen.getByTestId('order-detail')).toBeInTheDocument();
      });

      // 测试改签功能
      const changeTicketButton = screen.getByTestId('change-ticket-button');
      fireEvent.click(changeTicketButton);

      await waitFor(() => {
        expect(screen.getByTestId('change-ticket-modal')).toBeInTheDocument();
      });

      const newTrainButton = screen.getByTestId('new-train-G1003');
      fireEvent.click(newTrainButton);

      const confirmChangeButton = screen.getByTestId('confirm-change-button');
      fireEvent.click(confirmChangeButton);

      await waitFor(() => {
        expect(orderApi.changeTicket).toHaveBeenCalledWith('ORDER123', {
          newTrainNumber: 'G1003'
        });
        expect(screen.getByText('改签成功')).toBeInTheDocument();
      });

      // 测试退票功能
      const refundButton = screen.getByTestId('refund-button');
      fireEvent.click(refundButton);

      await waitFor(() => {
        expect(screen.getByTestId('refund-modal')).toBeInTheDocument();
      });

      const confirmRefundButton = screen.getByTestId('confirm-refund-button');
      fireEvent.click(confirmRefundButton);

      await waitFor(() => {
        expect(orderApi.refundTicket).toHaveBeenCalledWith('ORDER123');
        expect(screen.getByText('退票成功')).toBeInTheDocument();
      });
    });
  });

  describe('乘车人管理流程', () => {
    it('应该支持完整的乘车人管理功能', async () => {
      const { passengerApi } = await import('../../src/services/api');
      const { useAuthStore } = await import('../../src/stores/authStore');

      // Mock authenticated user
      const mockAuthStore = {
        user: { id: '1', phone: '13800138000', username: '测试用户' },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      // Mock API responses
      passengerApi.getPassengers.mockResolvedValue({
        success: true,
        data: {
          passengers: [
            {
              id: '1',
              name: '张三',
              idCard: '110101199001011234',
              phone: '13800138001',
              type: 'ADULT'
            }
          ]
        }
      });

      passengerApi.addPassenger.mockResolvedValue({
        success: true,
        data: {
          id: '2',
          name: '李四',
          idCard: '110101199001011235',
          phone: '13800138002',
          type: 'ADULT'
        }
      });

      passengerApi.updatePassenger.mockResolvedValue({
        success: true,
        data: { message: '修改成功' }
      });

      passengerApi.deletePassenger.mockResolvedValue({
        success: true,
        data: { message: '删除成功' }
      });

      renderApp();

      // 进入乘车人管理页面
      const passengersLink = screen.getByText('乘车人');
      fireEvent.click(passengersLink);

      await waitFor(() => {
        expect(passengerApi.getPassengers).toHaveBeenCalled();
        expect(screen.getByTestId('passenger-list')).toBeInTheDocument();
      });

      // 添加新乘车人
      const addPassengerButton = screen.getByTestId('add-passenger-button');
      fireEvent.click(addPassengerButton);

      await waitFor(() => {
        expect(screen.getByTestId('passenger-name-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('passenger-name-input'), {
        target: { value: '李四' }
      });
      fireEvent.change(screen.getByTestId('passenger-idcard-input'), {
        target: { value: '110101199001011235' }
      });
      fireEvent.change(screen.getByTestId('passenger-phone-input'), {
        target: { value: '13800138002' }
      });

      const savePassengerButton = screen.getByTestId('save-passenger-button');
      fireEvent.click(savePassengerButton);

      await waitFor(() => {
        expect(passengerApi.addPassenger).toHaveBeenCalledWith({
          name: '李四',
          idCard: '110101199001011235',
          phone: '13800138002',
          type: 'ADULT'
        });
        expect(screen.getByText('添加成功')).toBeInTheDocument();
      });

      // 编辑乘车人
      const editPassengerButton = screen.getByTestId('edit-passenger-李四');
      fireEvent.click(editPassengerButton);

      await waitFor(() => {
        expect(screen.getByTestId('passenger-phone-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('passenger-phone-input'), {
        target: { value: '13800138003' }
      });

      fireEvent.click(savePassengerButton);

      await waitFor(() => {
        expect(passengerApi.updatePassenger).toHaveBeenCalledWith('2', {
          phone: '13800138003'
        });
        expect(screen.getByText('修改成功')).toBeInTheDocument();
      });

      // 删除乘车人
      const deletePassengerButton = screen.getByTestId('delete-passenger-李四');
      fireEvent.click(deletePassengerButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByTestId('confirm-delete-button');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(passengerApi.deletePassenger).toHaveBeenCalledWith('2');
        expect(screen.getByText('删除成功')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该正确处理网络错误', async () => {
      const { ticketApi } = await import('../../src/services/api');
      const { useAuthStore } = await import('../../src/stores/authStore');

      const mockAuthStore = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      // Mock network error
      ticketApi.searchTrains.mockRejectedValue(new Error('Network Error'));

      renderApp();

      // 进入搜索页面
      const searchLink = screen.getByText('车票查询');
      fireEvent.click(searchLink);

      await waitFor(() => {
        expect(screen.getByTestId('departure-city-input')).toBeInTheDocument();
      });

      // 填写搜索条件
      fireEvent.change(screen.getByTestId('departure-city-input'), {
        target: { value: '北京' }
      });
      fireEvent.change(screen.getByTestId('arrival-city-input'), {
        target: { value: '上海' }
      });

      // 执行搜索
      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);

      // 验证错误处理
      await waitFor(() => {
        expect(screen.getByText('网络连接失败，请检查网络后重试')).toBeInTheDocument();
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
    });

    it('应该正确处理权限验证', async () => {
      const { useAuthStore } = await import('../../src/stores/authStore');

      const mockAuthStore = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setLoading: vi.fn(),
      };

      useAuthStore.mockReturnValue(mockAuthStore);

      renderApp();

      // 尝试访问需要登录的页面
      const ordersLink = screen.getByText('我的订单');
      fireEvent.click(ordersLink);

      // 验证重定向到登录页面
      await waitFor(() => {
        expect(screen.getByText('请先登录')).toBeInTheDocument();
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
      });
    });
  });
});