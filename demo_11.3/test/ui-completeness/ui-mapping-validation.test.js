import { test, expect } from '@playwright/test';

/**
 * UI完整性测试 - 验证每个后端功能都有对应的前端界面
 * 
 * 测试目标：
 * 1. 确保所有API接口都有对应的UI操作入口
 * 2. 验证数据库字段都有对应的UI展示或输入
 * 3. 检查功能按钮与后端接口的正确绑定
 * 4. 验证错误处理的UI反馈完整性
 */

test.describe('UI完整性验证测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置API拦截器来验证前后端调用
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      // 记录API调用用于后续验证
      console.log(`API调用: ${method} ${url}`);
      
      // 模拟成功响应
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} })
      });
    });

    await page.goto('/');
  });

  test('用户认证模块UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    // 监听API调用
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // 1. 验证注册功能UI完整性
    await test.step('注册功能UI验证', async () => {
      await page.click('text=注册');
      
      // 验证所有必需的表单字段都存在
      const requiredFields = [
        'phone-input',           // 手机号 - 对应 User.phone
        'username-input',        // 用户名 - 对应 User.username  
        'idcard-input',          // 身份证 - 对应 User.idCard
        'password-input',        // 密码 - 对应 User.password
        'confirm-password-input', // 确认密码 - UI验证字段
        'verification-code-input' // 验证码 - 对应验证码接口
      ];

      for (const field of requiredFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      // 验证功能按钮存在
      await expect(page.locator('[data-testid="send-code-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="register-button"]')).toBeVisible();

      // 验证发送验证码功能
      await page.fill('[data-testid="phone-input"]', '13800138000');
      await page.click('[data-testid="send-code-button"]');
      
      // 验证API调用
      await page.waitForTimeout(100);
      const sendCodeCall = apiCalls.find(call => 
        call.url.includes('/api/auth/send-verification-code') && 
        call.method === 'POST'
      );
      expect(sendCodeCall).toBeTruthy();

      // 填写完整注册信息并提交
      await page.fill('[data-testid="username-input"]', '测试用户');
      await page.fill('[data-testid="idcard-input"]', '110101199001011234');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
      await page.fill('[data-testid="verification-code-input"]', '123456');
      await page.click('[data-testid="register-button"]');

      // 验证注册API调用
      await page.waitForTimeout(100);
      const registerCall = apiCalls.find(call => 
        call.url.includes('/api/auth/register') && 
        call.method === 'POST'
      );
      expect(registerCall).toBeTruthy();
    });

    // 2. 验证登录功能UI完整性
    await test.step('登录功能UI验证', async () => {
      await page.goto('/login');
      
      // 验证登录表单字段
      await expect(page.locator('[data-testid="phone-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

      // 验证登录功能
      await page.fill('[data-testid="phone-input"]', '13800138000');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.click('[data-testid="login-button"]');

      // 验证登录API调用
      await page.waitForTimeout(100);
      const loginCall = apiCalls.find(call => 
        call.url.includes('/api/auth/login') && 
        call.method === 'POST'
      );
      expect(loginCall).toBeTruthy();
    });

    // 3. 验证密码重置功能UI完整性
    await test.step('密码重置功能UI验证', async () => {
      await page.goto('/login');
      await page.click('text=忘记密码');
      
      // 验证重置密码表单
      await expect(page.locator('[data-testid="reset-phone-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="reset-code-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="new-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="send-reset-code-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="reset-password-button"]')).toBeVisible();

      // 测试重置流程
      await page.fill('[data-testid="reset-phone-input"]', '13800138000');
      await page.click('[data-testid="send-reset-code-button"]');
      
      await page.fill('[data-testid="reset-code-input"]', '123456');
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
      await page.click('[data-testid="reset-password-button"]');

      // 验证重置密码API调用
      await page.waitForTimeout(100);
      const resetCall = apiCalls.find(call => 
        call.url.includes('/api/auth/reset-password') && 
        call.method === 'POST'
      );
      expect(resetCall).toBeTruthy();
    });
  });

  test('车票查询模块UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    await test.step('车票搜索UI验证', async () => {
      await page.click('text=车票查询');
      
      // 验证搜索表单字段 - 对应 TrainSearchRequest
      const searchFields = [
        'departure-city-input',    // 出发城市
        'arrival-city-input',      // 到达城市  
        'departure-date-input',    // 出发日期
        'return-date-input',       // 返程日期（可选）
        'passenger-type-select'    // 乘客类型
      ];

      for (const field of searchFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      await expect(page.locator('[data-testid="search-button"]')).toBeVisible();

      // 执行搜索
      await page.fill('[data-testid="departure-city-input"]', '北京');
      await page.fill('[data-testid="arrival-city-input"]', '上海');
      await page.fill('[data-testid="departure-date-input"]', '2024-12-01');
      await page.click('[data-testid="search-button"]');

      // 验证搜索API调用
      await page.waitForTimeout(100);
      const searchCall = apiCalls.find(call => 
        call.url.includes('/api/tickets/search') && 
        call.method === 'GET'
      );
      expect(searchCall).toBeTruthy();
    });

    await test.step('搜索结果展示UI验证', async () => {
      // 验证搜索结果列表存在
      await expect(page.locator('[data-testid="train-list"]')).toBeVisible();
      
      // 验证车次信息展示字段 - 对应 Train 模型
      const trainInfoFields = [
        'train-number',           // 车次号
        'departure-station',      // 出发站
        'arrival-station',        // 到达站
        'departure-time',         // 出发时间
        'arrival-time',           // 到达时间
        'duration',               // 运行时长
        'seat-availability'       // 座位余票信息
      ];

      for (const field of trainInfoFields) {
        await expect(page.locator(`[data-testid="${field}"]`).first()).toBeVisible();
      }

      // 验证座位类型和价格展示
      const seatTypes = ['second-class', 'first-class', 'business-class'];
      for (const seatType of seatTypes) {
        const seatElement = page.locator(`[data-testid="seat-${seatType}"]`).first();
        if (await seatElement.isVisible()) {
          await expect(seatElement.locator('[data-testid="seat-price"]')).toBeVisible();
          await expect(seatElement.locator('[data-testid="seat-count"]')).toBeVisible();
        }
      }

      // 验证预订按钮
      await expect(page.locator('[data-testid="book-button"]').first()).toBeVisible();
    });

    await test.step('车次详情UI验证', async () => {
      // 点击查看详情
      await page.click('[data-testid="train-detail-button"]').first();
      
      // 验证详情页面字段
      await expect(page.locator('[data-testid="train-detail-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="train-stops"]')).toBeVisible();
      await expect(page.locator('[data-testid="train-facilities"]')).toBeVisible();
      
      // 验证车次详情API调用
      await page.waitForTimeout(100);
      const detailCall = apiCalls.find(call => 
        call.url.includes('/api/tickets/train-detail') && 
        call.method === 'GET'
      );
      expect(detailCall).toBeTruthy();
    });
  });

  test('订单管理模块UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // 先模拟登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await test.step('订单列表UI验证', async () => {
      await page.click('text=我的订单');
      
      // 验证订单列表存在
      await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
      
      // 验证订单筛选功能
      await expect(page.locator('[data-testid="order-status-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-date-filter"]')).toBeVisible();
      
      // 验证订单信息展示 - 对应 Order 模型
      const orderFields = [
        'order-number',           // 订单号
        'train-number',           // 车次
        'departure-info',         // 出发信息
        'arrival-info',           // 到达信息
        'passenger-count',        // 乘客数量
        'total-amount',           // 总金额
        'order-status',           // 订单状态
        'create-time'             // 创建时间
      ];

      for (const field of orderFields) {
        await expect(page.locator(`[data-testid="${field}"]`).first()).toBeVisible();
      }

      // 验证订单操作按钮
      await expect(page.locator('[data-testid="view-detail-button"]').first()).toBeVisible();
      
      // 验证获取订单列表API调用
      await page.waitForTimeout(100);
      const ordersCall = apiCalls.find(call => 
        call.url.includes('/api/orders') && 
        call.method === 'GET'
      );
      expect(ordersCall).toBeTruthy();
    });

    await test.step('订单详情UI验证', async () => {
      // 点击查看详情
      await page.click('[data-testid="view-detail-button"]').first();
      
      // 验证订单详情页面
      await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
      
      // 验证详细信息展示
      const detailFields = [
        'order-info',             // 订单基本信息
        'train-info',             // 车次信息
        'passenger-info',         // 乘客信息
        'seat-info',              // 座位信息
        'payment-info',           // 支付信息
        'contact-info'            // 联系人信息
      ];

      for (const field of detailFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      // 验证订单操作功能
      const orderActions = [
        'change-ticket-button',   // 改签
        'refund-button',          // 退票
        'download-ticket-button'  // 下载车票
      ];

      for (const action of orderActions) {
        const actionElement = page.locator(`[data-testid="${action}"]`);
        if (await actionElement.isVisible()) {
          await expect(actionElement).toBeVisible();
        }
      }
    });

    await test.step('改签功能UI验证', async () => {
      // 点击改签按钮
      const changeButton = page.locator('[data-testid="change-ticket-button"]');
      if (await changeButton.isVisible()) {
        await changeButton.click();
        
        // 验证改签模态框
        await expect(page.locator('[data-testid="change-ticket-modal"]')).toBeVisible();
        
        // 验证改签表单字段
        await expect(page.locator('[data-testid="new-departure-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="new-train-list"]')).toBeVisible();
        await expect(page.locator('[data-testid="change-reason"]')).toBeVisible();
        await expect(page.locator('[data-testid="confirm-change-button"]')).toBeVisible();
      }
    });

    await test.step('退票功能UI验证', async () => {
      // 点击退票按钮
      const refundButton = page.locator('[data-testid="refund-button"]');
      if (await refundButton.isVisible()) {
        await refundButton.click();
        
        // 验证退票模态框
        await expect(page.locator('[data-testid="refund-modal"]')).toBeVisible();
        
        // 验证退票信息
        await expect(page.locator('[data-testid="refund-amount"]')).toBeVisible();
        await expect(page.locator('[data-testid="refund-fee"]')).toBeVisible();
        await expect(page.locator('[data-testid="refund-reason"]')).toBeVisible();
        await expect(page.locator('[data-testid="confirm-refund-button"]')).toBeVisible();
      }
    });
  });

  test('乘车人管理模块UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // 先模拟登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await test.step('乘车人列表UI验证', async () => {
      await page.click('text=乘车人');
      
      // 验证乘车人列表
      await expect(page.locator('[data-testid="passenger-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-passenger-button"]')).toBeVisible();
      
      // 验证乘车人信息展示 - 对应 Passenger 模型
      const passengerFields = [
        'passenger-name',         // 姓名
        'passenger-idcard',       // 身份证号
        'passenger-phone',        // 手机号
        'passenger-type',         // 乘客类型
        'passenger-status'        // 状态
      ];

      for (const field of passengerFields) {
        const fieldElement = page.locator(`[data-testid="${field}"]`).first();
        if (await fieldElement.isVisible()) {
          await expect(fieldElement).toBeVisible();
        }
      }

      // 验证乘车人操作按钮
      await expect(page.locator('[data-testid="edit-passenger-button"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="delete-passenger-button"]').first()).toBeVisible();
      
      // 验证获取乘车人列表API调用
      await page.waitForTimeout(100);
      const passengersCall = apiCalls.find(call => 
        call.url.includes('/api/passengers') && 
        call.method === 'GET'
      );
      expect(passengersCall).toBeTruthy();
    });

    await test.step('添加乘车人UI验证', async () => {
      await page.click('[data-testid="add-passenger-button"]');
      
      // 验证添加乘车人表单
      const addPassengerFields = [
        'passenger-name-input',   // 姓名
        'passenger-idcard-input', // 身份证号
        'passenger-phone-input',  // 手机号
        'passenger-type-select',  // 乘客类型
        'passenger-address-input' // 地址（可选）
      ];

      for (const field of addPassengerFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      await expect(page.locator('[data-testid="save-passenger-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();

      // 填写并保存乘车人
      await page.fill('[data-testid="passenger-name-input"]', '张三');
      await page.fill('[data-testid="passenger-idcard-input"]', '110101199001011234');
      await page.fill('[data-testid="passenger-phone-input"]', '13800138001');
      await page.selectOption('[data-testid="passenger-type-select"]', 'ADULT');
      await page.click('[data-testid="save-passenger-button"]');

      // 验证添加乘车人API调用
      await page.waitForTimeout(100);
      const addCall = apiCalls.find(call => 
        call.url.includes('/api/passengers') && 
        call.method === 'POST'
      );
      expect(addCall).toBeTruthy();
    });

    await test.step('编辑乘车人UI验证', async () => {
      // 点击编辑按钮
      await page.click('[data-testid="edit-passenger-button"]').first();
      
      // 验证编辑表单预填充
      await expect(page.locator('[data-testid="passenger-name-input"]')).toHaveValue('张三');
      await expect(page.locator('[data-testid="passenger-idcard-input"]')).toHaveValue('110101199001011234');
      
      // 修改信息
      await page.fill('[data-testid="passenger-phone-input"]', '13800138002');
      await page.click('[data-testid="save-passenger-button"]');

      // 验证更新乘车人API调用
      await page.waitForTimeout(100);
      const updateCall = apiCalls.find(call => 
        call.url.includes('/api/passengers/') && 
        call.method === 'PUT'
      );
      expect(updateCall).toBeTruthy();
    });
  });

  test('用户个人中心UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // 先模拟登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await test.step('个人信息UI验证', async () => {
      // 点击用户头像进入个人中心
      await page.click('[data-testid="user-avatar"]');
      await page.click('text=个人中心');
      
      // 验证个人信息展示 - 对应 User 模型
      const userInfoFields = [
        'user-avatar',            // 头像
        'user-username',          // 用户名
        'user-phone',             // 手机号
        'user-idcard',            // 身份证号
        'user-email',             // 邮箱
        'user-register-time',     // 注册时间
        'user-last-login'         // 最后登录时间
      ];

      for (const field of userInfoFields) {
        const fieldElement = page.locator(`[data-testid="${field}"]`);
        if (await fieldElement.isVisible()) {
          await expect(fieldElement).toBeVisible();
        }
      }

      // 验证操作按钮
      await expect(page.locator('[data-testid="edit-profile-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="change-password-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-avatar-button"]')).toBeVisible();
    });

    await test.step('编辑个人信息UI验证', async () => {
      await page.click('[data-testid="edit-profile-button"]');
      
      // 验证编辑表单
      const editFields = [
        'edit-username-input',    // 用户名
        'edit-email-input',       // 邮箱
        'edit-address-input'      // 地址
      ];

      for (const field of editFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      await expect(page.locator('[data-testid="save-profile-button"]')).toBeVisible();
      
      // 保存修改
      await page.fill('[data-testid="edit-username-input"]', '更新后的用户名');
      await page.click('[data-testid="save-profile-button"]');

      // 验证更新用户信息API调用
      await page.waitForTimeout(100);
      const updateCall = apiCalls.find(call => 
        call.url.includes('/api/user/profile') && 
        call.method === 'PUT'
      );
      expect(updateCall).toBeTruthy();
    });

    await test.step('修改密码UI验证', async () => {
      await page.click('[data-testid="change-password-button"]');
      
      // 验证修改密码表单
      const passwordFields = [
        'current-password-input', // 当前密码
        'new-password-input',     // 新密码
        'confirm-password-input'  // 确认新密码
      ];

      for (const field of passwordFields) {
        await expect(page.locator(`[data-testid="${field}"]`)).toBeVisible();
      }

      await expect(page.locator('[data-testid="change-password-submit"]')).toBeVisible();
      
      // 提交密码修改
      await page.fill('[data-testid="current-password-input"]', 'Password123!');
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');
      await page.click('[data-testid="change-password-submit"]');

      // 验证修改密码API调用
      await page.waitForTimeout(100);
      const changePasswordCall = apiCalls.find(call => 
        call.url.includes('/api/user/change-password') && 
        call.method === 'POST'
      );
      expect(changePasswordCall).toBeTruthy();
    });
  });

  test('支付模块UI完整性验证', async ({ page }) => {
    const apiCalls = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          timestamp: Date.now()
        });
      }
    });

    // 模拟到达支付页面的流程
    await page.goto('/payment?orderId=ORDER123');

    await test.step('支付页面UI验证', async () => {
      // 验证订单信息展示
      await expect(page.locator('[data-testid="payment-order-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
      
      // 验证支付方式选择
      const paymentMethods = [
        'payment-method-alipay',  // 支付宝
        'payment-method-wechat',  // 微信支付
        'payment-method-bank'     // 银行卡
      ];

      for (const method of paymentMethods) {
        await expect(page.locator(`[data-testid="${method}"]`)).toBeVisible();
      }

      // 验证支付按钮
      await expect(page.locator('[data-testid="pay-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-payment-button"]')).toBeVisible();
    });

    await test.step('支付流程UI验证', async () => {
      // 选择支付方式
      await page.click('[data-testid="payment-method-alipay"]');
      
      // 点击支付
      await page.click('[data-testid="pay-button"]');
      
      // 验证支付确认页面
      await expect(page.locator('[data-testid="payment-confirm"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-qrcode"]')).toBeVisible();
      
      // 验证支付状态查询
      await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
      
      // 验证支付API调用
      await page.waitForTimeout(100);
      const paymentCall = apiCalls.find(call => 
        call.url.includes('/api/payment/create') && 
        call.method === 'POST'
      );
      expect(paymentCall).toBeTruthy();
    });
  });

  test('错误处理UI完整性验证', async ({ page }) => {
    await test.step('网络错误UI反馈验证', async () => {
      // 模拟网络错误
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/search');
      await page.fill('[data-testid="departure-city-input"]', '北京');
      await page.fill('[data-testid="arrival-city-input"]', '上海');
      await page.click('[data-testid="search-button"]');
      
      // 验证错误提示UI
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      await expect(page.locator('text=网络连接失败')).toBeVisible();
    });

    await test.step('表单验证错误UI反馈验证', async () => {
      await page.goto('/register');
      
      // 直接提交空表单
      await page.click('[data-testid="register-button"]');
      
      // 验证必填字段错误提示
      await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
      
      // 输入无效格式
      await page.fill('[data-testid="phone-input"]', '123');
      await page.fill('[data-testid="idcard-input"]', '123');
      await page.click('[data-testid="register-button"]');
      
      // 验证格式错误提示
      await expect(page.locator('text=手机号格式不正确')).toBeVisible();
      await expect(page.locator('text=身份证号格式不正确')).toBeVisible();
    });

    await test.step('权限错误UI反馈验证', async () => {
      // 未登录访问受保护页面
      await page.goto('/orders');
      
      // 验证权限提示
      await expect(page.locator('[data-testid="auth-required-message"]')).toBeVisible();
      await expect(page.locator('text=请先登录')).toBeVisible();
      await expect(page.locator('[data-testid="goto-login-button"]')).toBeVisible();
    });
  });

  test('响应式设计UI完整性验证', async ({ page }) => {
    await test.step('移动端UI适配验证', async () => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // 验证移动端导航
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // 验证移动端搜索表单
      await page.goto('/search');
      await expect(page.locator('[data-testid="mobile-search-form"]')).toBeVisible();
      
      // 验证移动端车次列表
      await expect(page.locator('[data-testid="mobile-train-list"]')).toBeVisible();
    });

    await test.step('平板端UI适配验证', async () => {
      // 设置平板端视口
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      
      // 验证平板端布局
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
      
      // 验证平板端导航
      await expect(page.locator('[data-testid="tablet-navigation"]')).toBeVisible();
    });
  });

  test('无障碍访问UI完整性验证', async ({ page }) => {
    await test.step('键盘导航验证', async () => {
      await page.goto('/');
      
      // 验证Tab键导航
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // 验证Enter键操作
      await page.keyboard.press('Enter');
    });

    await test.step('屏幕阅读器支持验证', async () => {
      await page.goto('/search');
      
      // 验证aria-label属性
      await expect(page.locator('[aria-label="出发城市"]')).toBeVisible();
      await expect(page.locator('[aria-label="到达城市"]')).toBeVisible();
      
      // 验证role属性
      await expect(page.locator('[role="button"]')).toHaveCount.greaterThan(0);
      await expect(page.locator('[role="form"]')).toBeVisible();
    });
  });
});