const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// 模拟完整的应用程序
const app = express();
app.use(express.json());

// 模拟数据库
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./integration-test.sqlite'
    }
  }
});

// 导入路由（当前为模拟）
const authRoutes = require('../../src/routes/auth');
app.use('/api/auth', authRoutes);

describe('前后端集成测试', () => {
  beforeAll(async () => {
    // 初始化测试数据库
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.user.deleteMany();
    await prisma.verificationCode.deleteMany();
  });

  describe('用户认证流程集成测试', () => {
    it('应该完成完整的用户注册流程', async () => {
      // 步骤1: 发送验证码
      const sendCodeResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          codeType: 'register'
        });

      expect(sendCodeResponse.status).toBe(200);
      expect(sendCodeResponse.body.success).toBe(true);

      // 验证数据库中创建了验证码
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phoneNumber: '13800138000',
          codeType: 'register'
        }
      });
      expect(verificationCode).toBeTruthy();

      // 步骤2: 用户注册
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '集成测试用户',
          idCard: '110101199001011234',
          verificationCode: verificationCode.code
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user).toBeDefined();
      expect(registerResponse.body.data.token).toBeDefined();

      // 验证数据库中创建了用户
      const user = await prisma.user.findUnique({
        where: { phoneNumber: '13800138000' }
      });
      expect(user).toBeTruthy();
      expect(user.username).toBe('集成测试用户');

      // 步骤3: 用户登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.phoneNumber).toBe('13800138000');
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('应该正确处理验证码过期情况', async () => {
      // 创建过期的验证码
      const expiredCode = await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800138000',
          code: '123456',
          codeType: 'register',
          expiresAt: new Date(Date.now() - 60000), // 1分钟前过期
          createdAt: new Date(Date.now() - 120000) // 2分钟前创建
        }
      });

      // 尝试使用过期验证码注册
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '测试用户',
          idCard: '110101199001011234',
          verificationCode: '123456'
        });

      expect(registerResponse.status).toBe(400);
      expect(registerResponse.body.success).toBe(false);
      expect(registerResponse.body.message).toContain('验证码已过期');
    });

    it('应该防止重复注册相同手机号', async () => {
      // 先创建一个用户
      await prisma.user.create({
        data: {
          phoneNumber: '13800138000',
          passwordHash: 'hashed-password',
          username: '已存在用户',
          idCard: '110101199001011234'
        }
      });

      // 创建验证码
      const verificationCode = await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800138000',
          code: '123456',
          codeType: 'register',
          expiresAt: new Date(Date.now() + 300000)
        }
      });

      // 尝试注册相同手机号
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '新用户',
          idCard: '110101199001011235',
          verificationCode: '123456'
        });

      expect(registerResponse.status).toBe(409);
      expect(registerResponse.body.success).toBe(false);
      expect(registerResponse.body.message).toContain('手机号已注册');
    });
  });

  describe('API响应格式一致性测试', () => {
    it('所有API应该返回统一的响应格式', async () => {
      // 测试成功响应格式
      const successResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          codeType: 'register'
        });

      expect(successResponse.body).toHaveProperty('success');
      expect(successResponse.body).toHaveProperty('message');
      expect(successResponse.body).toHaveProperty('data');
      expect(typeof successResponse.body.success).toBe('boolean');

      // 测试错误响应格式
      const errorResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: 'invalid-phone',
          codeType: 'register'
        });

      expect(errorResponse.body).toHaveProperty('success');
      expect(errorResponse.body).toHaveProperty('message');
      expect(errorResponse.body.success).toBe(false);
      expect(typeof errorResponse.body.message).toBe('string');
    });

    it('应该正确处理请求参数验证', async () => {
      // 测试缺少必需参数
      const missingParamResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000'
          // 缺少其他必需参数
        });

      expect(missingParamResponse.status).toBe(400);
      expect(missingParamResponse.body.success).toBe(false);
      expect(missingParamResponse.body.message).toContain('参数');

      // 测试参数格式错误
      const invalidParamResponse = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '123', // 无效手机号格式
          codeType: 'register'
        });

      expect(invalidParamResponse.status).toBe(400);
      expect(invalidParamResponse.body.success).toBe(false);
    });
  });

  describe('数据库事务一致性测试', () => {
    it('注册失败时应该回滚所有数据库操作', async () => {
      // 创建验证码
      const verificationCode = await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800138000',
          code: '123456',
          codeType: 'register',
          expiresAt: new Date(Date.now() + 300000)
        }
      });

      // 模拟注册过程中的数据库错误（通过无效的身份证号）
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '测试用户',
          idCard: 'invalid-id-card', // 无效身份证号
          verificationCode: '123456'
        });

      expect(registerResponse.status).toBe(400);

      // 验证用户没有被创建
      const user = await prisma.user.findUnique({
        where: { phoneNumber: '13800138000' }
      });
      expect(user).toBeNull();

      // 验证验证码仍然存在（没有被错误删除）
      const codeStillExists = await prisma.verificationCode.findFirst({
        where: {
          phoneNumber: '13800138000',
          code: '123456'
        }
      });
      expect(codeStillExists).toBeTruthy();
    });
  });

  describe('并发请求处理测试', () => {
    it('应该正确处理并发的验证码请求', async () => {
      // 同时发送多个验证码请求
      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/auth/send-verification-code')
          .send({
            phoneNumber: '13800138000',
            codeType: 'register'
          })
      );

      const responses = await Promise.all(requests);

      // 应该只有一个请求成功，其他被限流
      const successCount = responses.filter(res => res.status === 200).length;
      const rateLimitedCount = responses.filter(res => res.status === 429).length;

      expect(successCount).toBe(1);
      expect(rateLimitedCount).toBe(2);

      // 验证数据库中只有一条验证码记录
      const codes = await prisma.verificationCode.findMany({
        where: {
          phoneNumber: '13800138000',
          codeType: 'register'
        }
      });
      expect(codes.length).toBe(1);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该正确处理数据库连接错误', async () => {
      // 模拟数据库连接错误（通过断开连接）
      await prisma.$disconnect();

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          codeType: 'register'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('服务器内部错误');

      // 重新连接数据库
      await prisma.$connect();
    });

    it('应该正确处理网络超时', async () => {
      // 模拟长时间运行的请求
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(request(app)
            .post('/api/auth/send-verification-code')
            .send({
              phoneNumber: '13800138000',
              codeType: 'register'
            })
            .timeout(100)); // 设置100ms超时
        }, 200); // 200ms后执行请求
      });

      try {
        await timeoutPromise;
      } catch (error) {
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('安全性集成测试', () => {
    it('应该防止SQL注入攻击', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: maliciousInput,
          codeType: 'register'
        });

      // 应该返回参数验证错误，而不是数据库错误
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号格式不正确');

      // 验证数据库表仍然存在
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    it('应该防止XSS攻击', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      // 创建验证码
      const verificationCode = await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800138000',
          code: '123456',
          codeType: 'register',
          expiresAt: new Date(Date.now() + 300000)
        }
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: xssPayload,
          idCard: '110101199001011234',
          verificationCode: '123456'
        });

      if (response.status === 201) {
        // 如果注册成功，验证用户名被正确转义
        expect(response.body.data.user.username).not.toContain('<script>');
      } else {
        // 如果注册失败，应该是因为参数验证
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('用户名格式不正确');
      }
    });
  });
});