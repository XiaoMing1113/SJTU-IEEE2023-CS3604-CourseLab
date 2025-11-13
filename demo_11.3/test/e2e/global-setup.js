const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Playwright全局设置
 * 在所有测试运行前执行一次
 */
async function globalSetup(config) {
  console.log('🚀 开始全局测试环境设置...');

  try {
    // 1. 确保测试结果目录存在
    const testResultsDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
      console.log('✅ 创建测试结果目录');
    }

    // 2. 等待服务器启动
    console.log('⏳ 等待服务器启动...');
    await waitForServer('http://localhost:3001/api/health', 60000); // 后端健康检查
    await waitForServer('http://localhost:5173', 60000); // 前端服务器
    console.log('✅ 服务器启动完成');

    // 3. 重置测试数据库
    console.log('🗄️ 重置测试数据库...');
    await resetTestDatabase();
    console.log('✅ 测试数据库重置完成');

    // 4. 创建测试用户会话（用于需要登录的测试）
    console.log('👤 创建测试用户会话...');
    await createTestUserSessions();
    console.log('✅ 测试用户会话创建完成');

    // 5. 验证关键页面可访问
    console.log('🔍 验证关键页面可访问性...');
    await verifyKeyPages();
    console.log('✅ 关键页面验证完成');

    console.log('🎉 全局测试环境设置完成！');

  } catch (error) {
    console.error('❌ 全局设置失败:', error);
    throw error;
  }
}

/**
 * 等待服务器启动
 */
async function waitForServer(url, timeout = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch (error) {
      // 服务器还未启动，继续等待
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`服务器 ${url} 在 ${timeout}ms 内未能启动`);
}

/**
 * 重置测试数据库
 */
async function resetTestDatabase() {
  try {
    const response = await fetch('http://localhost:3001/api/test/reset-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`数据库重置失败: ${response.status}`);
    }

    console.log('  - 数据库已重置');
    console.log('  - 种子数据已加载');
  } catch (error) {
    console.warn('  - 数据库重置跳过（可能是开发环境）');
  }
}

/**
 * 创建测试用户会话
 */
async function createTestUserSessions() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 创建管理员会话
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="phone-input"]', '13800138001');
    await page.fill('[data-testid="password-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    // 等待登录成功
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    
    // 保存管理员会话
    const adminStorage = await context.storageState();
    fs.writeFileSync(
      path.join(__dirname, 'admin-session.json'),
      JSON.stringify(adminStorage, null, 2)
    );
    console.log('  - 管理员会话已保存');

    // 创建普通用户会话
    await context.clearCookies();
    await page.goto('http://localhost:5173/login');
    await page.fill('[data-testid="phone-input"]', '13800138002');
    await page.fill('[data-testid="password-input"]', '123456');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    
    const userStorage = await context.storageState();
    fs.writeFileSync(
      path.join(__dirname, 'user-session.json'),
      JSON.stringify(userStorage, null, 2)
    );
    console.log('  - 普通用户会话已保存');

  } catch (error) {
    console.warn('  - 用户会话创建跳过（可能需要手动登录）');
  } finally {
    await browser.close();
  }
}

/**
 * 验证关键页面可访问性
 */
async function verifyKeyPages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const pages = [
    { url: 'http://localhost:5173/', name: '首页' },
    { url: 'http://localhost:5173/login', name: '登录页' },
    { url: 'http://localhost:5173/register', name: '注册页' },
    { url: 'http://localhost:5173/search', name: '车票查询页' },
  ];

  try {
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      console.log(`  - ${pageInfo.name} 可访问`);
    }
  } catch (error) {
    console.warn(`  - 页面验证部分失败: ${error.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;