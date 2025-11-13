import request from 'supertest';
import express from 'express';
import { AuthController } from '../src/controllers/AuthController';
import { prisma, testUtils } from './setup';

// Jest全局函数声明
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  const expect: any;
}

const app = express();
app.use(express.json());

const authController = new AuthController();

// 设置路由
app.post('/api/auth/send-verification-code', authController.sendVerificationCode);
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh-token', authController.refreshToken);
app.post('/api/auth/logout', authController.logout);
app.post('/api/auth/reset-password', authController.resetPassword);

describe('AuthController', () => {
  describe('发送验证码 (sendVerificationCode)', () => {
    it('应该成功发送注册验证码', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          codeType: 'register'
        });

      // 测试期望：验证码发送成功
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('验证码已发送');
      
      // 验证数据库中是否创建了验证码记录
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phoneNumber: '13800138000',
          codeType: 'register'
        }
      });
      expect(verificationCode).toBeTruthy();
    });

    it('应该拒绝无效的手机号格式', async () => {
      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '123',
          codeType: 'register'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号格式不正确');
    });

    it('应该限制验证码发送频率', async () => {
      // 先发送一次验证码
      await testUtils.createTestVerificationCode({
        phoneNumber: '13800138000',
        codeType: 'register',
        createdAt: new Date()
      });

      const response = await request(app)
        .post('/api/auth/send-verification-code')
        .send({
          phoneNumber: '13800138000',
          codeType: 'register'
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发送过于频繁');
    });
  });

  describe('用户注册 (register)', () => {
    beforeEach(async () => {
      // 为每个测试创建有效的验证码
      await testUtils.createTestVerificationCode({
        phoneNumber: '13800138000',
        code: '123456',
        codeType: 'register'
      });
    });

    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '新用户',
          idCard: '110101199001011234',
          verificationCode: '123456'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      
      // 验证用户已创建
      const user = await prisma.user.findUnique({
        where: { phoneNumber: '13800138000' }
      });
      expect(user).toBeTruthy();
      expect(user?.username).toBe('新用户');
    });

    it('应该拒绝重复的手机号注册', async () => {
      // 先创建一个用户
      await testUtils.createTestUser({
        phoneNumber: '13800138000'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '新用户',
          idCard: '110101199001011235',
          verificationCode: '123456'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号已注册');
    });

    it('应该验证密码强度', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: '123',
          confirmPassword: '123',
          username: '新用户',
          idCard: '110101199001011234',
          verificationCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码强度不足');
    });

    it('应该验证身份证号格式', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          username: '新用户',
          idCard: '123',
          verificationCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('身份证号格式不正确');
    });
  });

  describe('用户登录 (login)', () => {
    beforeEach(async () => {
      // 创建测试用户
      await testUtils.createTestUser({
        phoneNumber: '13800138000',
        passwordHash: 'hashed-Password123!', // 实际应该是加密后的密码
        username: '测试用户'
      });
    });

    it('应该成功登录有效用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.phoneNumber).toBe('13800138000');
    });

    it('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号或密码错误');
    });

    it('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13900139000',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号或密码错误');
    });

    it('应该处理账户锁定情况', async () => {
      // 更新用户为锁定状态
      await prisma.user.update({
        where: { phoneNumber: '13800138000' },
        data: { 
          loginAttempts: 5, // 超过最大尝试次数
          lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 锁定30分钟
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138000',
          password: 'Password123!'
        });

      expect(response.status).toBe(423);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('账户已被锁定');
    });
  });

  describe('刷新Token (refreshToken)', () => {
    it('应该成功刷新有效的Token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      // 当前为骨架实现，应该返回未实现错误
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('功能尚未实现');
    });

    it('应该拒绝无效的刷新Token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
        });

      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
    });
  });

  describe('用户登出 (logout)', () => {
    it('应该成功登出用户', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      // 当前为骨架实现
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('功能尚未实现');
    });
  });

  describe('重置密码 (resetPassword)', () => {
    beforeEach(async () => {
      // 创建测试用户和验证码
      await testUtils.createTestUser({
        phoneNumber: '13800138000'
      });
      await testUtils.createTestVerificationCode({
        phoneNumber: '13800138000',
        code: '123456',
        codeType: 'reset'
      });
    });

    it('应该成功重置密码', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: '13800138000',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
          verificationCode: '123456'
        });

      // 当前为骨架实现
      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('功能尚未实现');
    });

    it('应该验证新密码强度', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          phoneNumber: '13800138000',
          newPassword: '123',
          confirmPassword: '123',
          verificationCode: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});