/**
 * VerificationController 单元测试
 * 测试验证码相关API的业务逻辑
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { VerificationController } from '../src/controllers/VerificationController';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.sqlite'
    }
  }
});

const verificationController = new VerificationController();

// 设置路由
app.post('/api/verification/send', verificationController.sendVerificationCode);
app.post('/api/verification/verify', verificationController.verifyCode);
app.get('/api/verification/captcha', verificationController.generateCaptcha);
app.post('/api/verification/captcha/verify', verificationController.verifyCaptcha);
app.use(errorHandler);

describe('VerificationController', () => {
  beforeAll(async () => {
    await prisma.$connect();
    
    // 清理测试数据
    await prisma.verificationCode.deleteMany();
  });

  afterAll(async () => {
    await prisma.verificationCode.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理验证码数据
    await prisma.verificationCode.deleteMany();
  });

  describe('POST /api/verification/send', () => {
    it('应该成功发送验证码', async () => {
      const phoneData = {
        phoneNumber: '13800139999',
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('验证码已发送');

      // 验证数据库中是否创建了验证码记录
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phoneNumber: '13800139999',
          type: 'register'
        }
      });
      expect(verificationCode).not.toBeNull();
      expect(verificationCode?.code).toHaveLength(6);
      expect(verificationCode?.isUsed).toBe(false);
    });

    it('应该验证手机号格式', async () => {
      const phoneData = {
        phoneNumber: '123456', // 格式错误
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('手机号格式');
    });

    it('应该验证验证码类型', async () => {
      const phoneData = {
        phoneNumber: '13800139999',
        type: 'invalid_type' // 无效类型
      };

      const response = await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码类型');
    });

    it('应该在缺少必需字段时返回400错误', async () => {
      const phoneData = {
        // 缺少 phoneNumber
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该限制同一手机号的发送频率', async () => {
      const phoneData = {
        phoneNumber: '13800139999',
        type: 'register'
      };

      // 第一次发送
      await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      // 立即再次发送
      const response = await request(app)
        .post('/api/verification/send')
        .send(phoneData);

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('发送频率');
    });
  });

  describe('POST /api/verification/verify', () => {
    let testVerificationCode: string;

    beforeEach(async () => {
      // 创建测试验证码
      testVerificationCode = '123456';
      await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800139999',
          code: testVerificationCode,
          type: 'register',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟后过期
          isUsed: false
        }
      });
    });

    it('应该成功验证正确的验证码', async () => {
      const verifyData = {
        phoneNumber: '13800139999',
        code: testVerificationCode,
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/verify')
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('验证成功');

      // 验证码应该被标记为已使用
      const usedCode = await prisma.verificationCode.findFirst({
        where: {
          phoneNumber: '13800139999',
          code: testVerificationCode,
          type: 'register'
        }
      });
      expect(usedCode?.isUsed).toBe(true);
    });

    it('应该在验证码错误时返回400错误', async () => {
      const verifyData = {
        phoneNumber: '13800139999',
        code: '654321', // 错误的验证码
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码错误');
    });

    it('应该在验证码过期时返回400错误', async () => {
      // 创建过期的验证码
      await prisma.verificationCode.create({
        data: {
          phoneNumber: '13800138888',
          code: '789012',
          type: 'register',
          expiresAt: new Date(Date.now() - 1000), // 已过期
          isUsed: false
        }
      });

      const verifyData = {
        phoneNumber: '13800138888',
        code: '789012',
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码已过期');
    });

    it('应该在验证码已使用时返回400错误', async () => {
      // 先使用验证码
      await prisma.verificationCode.updateMany({
        where: {
          phoneNumber: '13800139999',
          code: testVerificationCode,
          type: 'register'
        },
        data: {
          isUsed: true
        }
      });

      const verifyData = {
        phoneNumber: '13800139999',
        code: testVerificationCode,
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码已使用');
    });

    it('应该在验证码不存在时返回400错误', async () => {
      const verifyData = {
        phoneNumber: '13800137777', // 不存在的手机号
        code: '123456',
        type: 'register'
      };

      const response = await request(app)
        .post('/api/verification/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码错误');
    });
  });

  describe('GET /api/verification/captcha', () => {
    it('应该生成图形验证码', async () => {
      const response = await request(app)
        .get('/api/verification/captcha');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('captchaId');
      expect(response.body.data).toHaveProperty('captchaImage');
      
      // 验证captchaId是UUID格式
      expect(response.body.data.captchaId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      
      // 验证图片是base64格式
      expect(response.body.data.captchaImage).toMatch(/^data:image\/png;base64,/);
    });

    it('应该每次生成不同的验证码', async () => {
      const response1 = await request(app).get('/api/verification/captcha');
      const response2 = await request(app).get('/api/verification/captcha');

      expect(response1.body.data.captchaId).not.toBe(response2.body.data.captchaId);
      expect(response1.body.data.captchaImage).not.toBe(response2.body.data.captchaImage);
    });
  });

  describe('POST /api/verification/captcha/verify', () => {
    let captchaId: string;
    let captchaText: string;

    beforeEach(async () => {
      // 生成验证码
      const response = await request(app).get('/api/verification/captcha');
      captchaId = response.body.data.captchaId;
      
      // 从数据库获取验证码文本（实际应用中这是不可见的）
      const captchaRecord = await prisma.verificationCode.findFirst({
        where: { id: captchaId }
      });
      captchaText = captchaRecord?.code || '';
    });

    it('应该成功验证正确的图形验证码', async () => {
      const verifyData = {
        captchaId,
        captchaText
      };

      const response = await request(app)
        .post('/api/verification/captcha/verify')
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('验证成功');
    });

    it('应该在验证码错误时返回400错误', async () => {
      const verifyData = {
        captchaId,
        captchaText: 'wrong'
      };

      const response = await request(app)
        .post('/api/verification/captcha/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码错误');
    });

    it('应该在验证码ID不存在时返回400错误', async () => {
      const verifyData = {
        captchaId: 'nonexistent-id',
        captchaText: 'test'
      };

      const response = await request(app)
        .post('/api/verification/captcha/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('验证码错误');
    });

    it('应该在缺少必需字段时返回400错误', async () => {
      const verifyData = {
        // 缺少 captchaId
        captchaText: 'test'
      };

      const response = await request(app)
        .post('/api/verification/captcha/verify')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});