import { test, expect } from '@playwright/test';

test.describe('12306完整购票流程端到端测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问首页
    await page.goto('/');
  });

  test('完整的用户注册到购票流程', async ({ page }) => {
    // 步骤1: 用户注册
    await test.step('用户注册', async () => {
      // 点击注册链接
      await page.click('text=注册');
      await expect(page).toHaveURL('/register');

      // 填写注册表单
      await page.fill('[data-testid="phone-input"]', '13800138000');
      await page.fill('[data-testid="username-input"]', '端到端测试用户');
      await page.fill('[data-testid="idcard-input"]', '110101199001011234');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');

      // 发送验证码
      await page.click('[data-testid="send-code-button"]');
      await expect(page.locator('text=验证码已发送')).toBeVisible();

      // 填写验证码（模拟）
      await page.fill('[data-testid="verification-code-input"]', '123456');

      // 提交注册
      await page.click('[data-testid="register-button"]');
      
      // 验证注册成功并跳转到首页
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    });

    // 步骤2: 查询车票
    await test.step('查询车票', async () => {
      // 点击车票查询
      await page.click('text=车票查询');
      await expect(page).toHaveURL('/search');

      // 填写查询条件
      await page.fill('[data-testid="departure-city-input"]', '北京');
      await page.fill('[data-testid="arrival-city-input"]', '上海');
      await page.fill('[data-testid="departure-date-input"]', '2024-12-01');

      // 点击查询
      await page.click('[data-testid="search-button"]');

      // 等待查询结果
      await expect(page.locator('[data-testid="train-list"]')).toBeVisible();
      await expect(page.locator('text=G1001')).toBeVisible();
    });

    // 步骤3: 选择车次和座位
    await test.step('选择车次和座位', async () => {
      // 点击预订按钮
      await page.click('[data-testid="book-button-G1001"]');
      
      // 验证跳转到预订页面
      await expect(page).toHaveURL(/\/booking/);
      
      // 选择座位类型
      await page.click('[data-testid="seat-type-second-class"]');
      
      // 验证座位信息显示
      await expect(page.locator('text=二等座')).toBeVisible();
      await expect(page.locator('text=￥553')).toBeVisible();
    });

    // 步骤4: 添加乘车人
    await test.step('添加乘车人', async () => {
      // 点击添加乘车人
      await page.click('[data-testid="add-passenger-button"]');
      
      // 填写乘车人信息
      await page.fill('[data-testid="passenger-name-input"]', '张三');
      await page.fill('[data-testid="passenger-idcard-input"]', '110101199001011235');
      await page.fill('[data-testid="passenger-phone-input"]', '13800138001');
      
      // 选择乘客类型
      await page.selectOption('[data-testid="passenger-type-select"]', 'ADULT');
      
      // 保存乘车人
      await page.click('[data-testid="save-passenger-button"]');
      
      // 验证乘车人添加成功
      await expect(page.locator('text=张三')).toBeVisible();
      await expect(page.locator('text=110101199001011235')).toBeVisible();
    });

    // 步骤5: 确认订单
    await test.step('确认订单', async () => {
      // 点击确认订单
      await page.click('[data-testid="confirm-order-button"]');
      
      // 验证订单确认页面
      await expect(page).toHaveURL(/\/order-confirm/);
      
      // 验证订单信息
      await expect(page.locator('text=G1001')).toBeVisible();
      await expect(page.locator('text=北京')).toBeVisible();
      await expect(page.locator('text=上海')).toBeVisible();
      await expect(page.locator('text=张三')).toBeVisible();
      await expect(page.locator('text=￥553')).toBeVisible();
      
      // 提交订单
      await page.click('[data-testid="submit-order-button"]');
      
      // 验证跳转到支付页面
      await expect(page).toHaveURL(/\/payment/);
    });

    // 步骤6: 模拟支付
    await test.step('完成支付', async () => {
      // 选择支付方式
      await page.click('[data-testid="payment-method-alipay"]');
      
      // 点击支付
      await page.click('[data-testid="pay-button"]');
      
      // 模拟支付成功
      await expect(page.locator('text=支付成功')).toBeVisible();
      
      // 点击查看订单
      await page.click('[data-testid="view-order-button"]');
      
      // 验证跳转到订单详情页面
      await expect(page).toHaveURL(/\/orders/);
      await expect(page.locator('text=已支付')).toBeVisible();
    });
  });

  test('已注册用户的快速购票流程', async ({ page }) => {
    // 步骤1: 用户登录
    await test.step('用户登录', async () => {
      await page.click('text=登录');
      await expect(page).toHaveURL('/login');

      await page.fill('[data-testid="phone-input"]', '13800138000');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    });

    // 步骤2: 快速查询和预订
    await test.step('快速查询和预订', async () => {
      // 在首页直接搜索
      await page.fill('[data-testid="quick-departure-input"]', '北京');
      await page.fill('[data-testid="quick-arrival-input"]', '上海');
      await page.fill('[data-testid="quick-date-input"]', '2024-12-01');
      await page.click('[data-testid="quick-search-button"]');

      // 直接预订
      await page.click('[data-testid="quick-book-button-G1001"]');
      
      // 选择已保存的乘车人
      await page.click('[data-testid="saved-passenger-张三"]');
      
      // 快速确认订单
      await page.click('[data-testid="quick-confirm-button"]');
      
      // 验证订单创建成功
      await expect(page.locator('text=订单创建成功')).toBeVisible();
    });
  });

  test('订单管理完整流程', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    // 步骤1: 查看订单列表
    await test.step('查看订单列表', async () => {
      await page.click('text=我的订单');
      await expect(page).toHaveURL('/orders');
      
      // 验证订单列表显示
      await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-item"]')).toHaveCount.greaterThan(0);
    });

    // 步骤2: 查看订单详情
    await test.step('查看订单详情', async () => {
      await page.click('[data-testid="order-item"]:first-child');
      
      // 验证订单详情页面
      await expect(page).toHaveURL(/\/orders\/.*\/detail/);
      await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
      
      // 验证订单信息完整性
      await expect(page.locator('[data-testid="train-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="passenger-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="seat-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-info"]')).toBeVisible();
    });

    // 步骤3: 订单操作（退票/改签）
    await test.step('订单操作', async () => {
      // 测试改签功能
      await page.click('[data-testid="change-ticket-button"]');
      await expect(page.locator('[data-testid="change-ticket-modal"]')).toBeVisible();
      
      // 选择新的车次
      await page.click('[data-testid="new-train-G1003"]');
      await page.click('[data-testid="confirm-change-button"]');
      
      // 验证改签成功
      await expect(page.locator('text=改签成功')).toBeVisible();
      
      // 测试退票功能
      await page.click('[data-testid="refund-button"]');
      await expect(page.locator('[data-testid="refund-modal"]')).toBeVisible();
      
      // 确认退票
      await page.click('[data-testid="confirm-refund-button"]');
      
      // 验证退票成功
      await expect(page.locator('text=退票成功')).toBeVisible();
    });
  });

  test('乘车人管理完整流程', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    // 步骤1: 进入乘车人管理
    await test.step('进入乘车人管理', async () => {
      await page.click('text=乘车人');
      await expect(page).toHaveURL('/passengers');
      
      // 验证乘车人列表
      await expect(page.locator('[data-testid="passenger-list"]')).toBeVisible();
    });

    // 步骤2: 添加新乘车人
    await test.step('添加新乘车人', async () => {
      await page.click('[data-testid="add-passenger-button"]');
      
      // 填写乘车人信息
      await page.fill('[data-testid="passenger-name-input"]', '李四');
      await page.fill('[data-testid="passenger-idcard-input"]', '110101199001011236');
      await page.fill('[data-testid="passenger-phone-input"]', '13800138002');
      await page.selectOption('[data-testid="passenger-type-select"]', 'ADULT');
      
      // 保存乘车人
      await page.click('[data-testid="save-passenger-button"]');
      
      // 验证添加成功
      await expect(page.locator('text=李四')).toBeVisible();
      await expect(page.locator('text=添加成功')).toBeVisible();
    });

    // 步骤3: 编辑乘车人信息
    await test.step('编辑乘车人信息', async () => {
      await page.click('[data-testid="edit-passenger-李四"]');
      
      // 修改手机号
      await page.fill('[data-testid="passenger-phone-input"]', '13800138003');
      
      // 保存修改
      await page.click('[data-testid="save-passenger-button"]');
      
      // 验证修改成功
      await expect(page.locator('text=13800138003')).toBeVisible();
      await expect(page.locator('text=修改成功')).toBeVisible();
    });

    // 步骤4: 删除乘车人
    await test.step('删除乘车人', async () => {
      await page.click('[data-testid="delete-passenger-李四"]');
      
      // 确认删除
      await page.click('[data-testid="confirm-delete-button"]');
      
      // 验证删除成功
      await expect(page.locator('text=李四')).not.toBeVisible();
      await expect(page.locator('text=删除成功')).toBeVisible();
    });
  });

  test('用户个人中心管理流程', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '13800138000');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    // 步骤1: 进入个人中心
    await test.step('进入个人中心', async () => {
      await page.click('[data-testid="user-avatar"]');
      await page.click('text=个人中心');
      await expect(page).toHaveURL('/profile');
      
      // 验证个人信息显示
      await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
      await expect(page.locator('text=13800138000')).toBeVisible();
    });

    // 步骤2: 修改个人信息
    await test.step('修改个人信息', async () => {
      await page.click('[data-testid="edit-profile-button"]');
      
      // 修改用户名
      await page.fill('[data-testid="username-input"]', '更新后的用户名');
      
      // 保存修改
      await page.click('[data-testid="save-profile-button"]');
      
      // 验证修改成功
      await expect(page.locator('text=更新后的用户名')).toBeVisible();
      await expect(page.locator('text=保存成功')).toBeVisible();
    });

    // 步骤3: 修改密码
    await test.step('修改密码', async () => {
      await page.click('[data-testid="change-password-tab"]');
      
      // 填写密码信息
      await page.fill('[data-testid="current-password-input"]', 'Password123!');
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-new-password-input"]', 'NewPassword123!');
      
      // 提交修改
      await page.click('[data-testid="change-password-button"]');
      
      // 验证修改成功
      await expect(page.locator('text=密码修改成功')).toBeVisible();
    });

    // 步骤4: 安全设置
    await test.step('安全设置', async () => {
      await page.click('[data-testid="security-tab"]');
      
      // 绑定邮箱
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.click('[data-testid="bind-email-button"]');
      
      // 验证绑定成功
      await expect(page.locator('text=邮箱绑定成功')).toBeVisible();
      
      // 开启二次验证
      await page.click('[data-testid="enable-2fa-switch"]');
      
      // 验证开启成功
      await expect(page.locator('text=二次验证已开启')).toBeVisible();
    });
  });

  test('错误处理和边界情况测试', async ({ page }) => {
    // 测试网络错误处理
    await test.step('网络错误处理', async () => {
      // 模拟网络断开
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      await page.click('text=车票查询');
      
      // 填写查询条件并搜索
      await page.fill('[data-testid="departure-city-input"]', '北京');
      await page.fill('[data-testid="arrival-city-input"]', '上海');
      await page.click('[data-testid="search-button"]');
      
      // 验证错误提示
      await expect(page.locator('text=网络连接失败')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    // 测试表单验证
    await test.step('表单验证', async () => {
      await page.goto('/register');
      
      // 直接提交空表单
      await page.click('[data-testid="register-button"]');
      
      // 验证必填字段提示
      await expect(page.locator('text=请输入手机号')).toBeVisible();
      await expect(page.locator('text=请输入密码')).toBeVisible();
      await expect(page.locator('text=请输入用户名')).toBeVisible();
      
      // 输入无效格式
      await page.fill('[data-testid="phone-input"]', '123');
      await page.fill('[data-testid="idcard-input"]', '123');
      await page.click('[data-testid="register-button"]');
      
      // 验证格式错误提示
      await expect(page.locator('text=手机号格式不正确')).toBeVisible();
      await expect(page.locator('text=身份证号格式不正确')).toBeVisible();
    });

    // 测试权限控制
    await test.step('权限控制', async () => {
      // 未登录访问受保护页面
      await page.goto('/orders');
      
      // 验证重定向到登录页面
      await expect(page).toHaveURL('/login');
      await expect(page.locator('text=请先登录')).toBeVisible();
    });
  });

  test('响应式设计测试', async ({ page }) => {
    // 测试移动端适配
    await test.step('移动端适配', async () => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // 验证移动端导航菜单
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // 点击菜单按钮
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // 验证菜单项
      await expect(page.locator('text=车票查询')).toBeVisible();
      await expect(page.locator('text=我的订单')).toBeVisible();
    });

    // 测试平板端适配
    await test.step('平板端适配', async () => {
      // 设置平板端视口
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/search');
      
      // 验证搜索表单在平板端的布局
      await expect(page.locator('[data-testid="search-form"]')).toBeVisible();
      
      // 验证搜索结果在平板端的显示
      await page.fill('[data-testid="departure-city-input"]', '北京');
      await page.fill('[data-testid="arrival-city-input"]', '上海');
      await page.click('[data-testid="search-button"]');
      
      await expect(page.locator('[data-testid="train-list"]')).toBeVisible();
    });
  });
});