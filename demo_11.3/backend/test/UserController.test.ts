/**
 * UserController 单元测试
 * 测试用户管理相关API的业务逻辑
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserController } from '../src/controllers/UserController';
import { authMiddleware } from '../src/middleware/auth';
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

const userController = new UserController();

// 设置路由
app.get('/api/user/profile', authMiddleware, userController.getProfile);
app.put('/api/user/profile', authMiddleware, userController.updateProfile);
app.put('/api/user/password', authMiddleware, userController.changePassword);
app.post('/api/user/upload-avatar', authMiddleware, userController.uploadAvatar);
app.use(errorHandler);

describe('UserController', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    await prisma.$connect();
    
    // 清理测试数据
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.user.deleteMany();
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prisma.user.create({
      data: {
        phoneNumber: '13800139999',
        idCard: '110101199001012222',
        username: '用户测试',
        passwordHash: hashedPassword,
        email: 'test@example.com',
        realName: '张三',
      },
    });

    // 生成JWT token
    authToken = jwt.sign(
      { userId: testUser.id, phoneNumber: testUser.phoneNumber },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/user/profile', () => {
    it('应该返回用户的个人资料', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      
      const user = response.body.data.user;
      expect(user).toHaveProperty('id', testUser.id);
      expect(user).toHaveProperty('phoneNumber', '13800139999');
      expect(user).toHaveProperty('username', '用户测试');
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).toHaveProperty('realName', '张三');
      expect(user).toHaveProperty('idCard', '110101199001012222');
      
      // 确保密码哈希不会被返回
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('应该在缺少认证token时返回401错误', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('应该在token无效时返回401错误', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('应该成功更新用户资料', async () => {
      const updateData = {
        username: '更新后的用户名',
        email: 'updated@example.com',
        realName: '李四'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      
      const user = response.body.data.user;
      expect(user).toHaveProperty('username', '更新后的用户名');
      expect(user).toHaveProperty('email', 'updated@example.com');
      expect(user).toHaveProperty('realName', '李四');
    });

    it('应该验证邮箱格式', async () => {
      const updateData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱格式');
    });

    it('应该拒绝更新敏感字段', async () => {
      const updateData = {
        phoneNumber: '13800138888', // 不应该允许更新
        idCard: '110101199002023333' // 不应该允许更新
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // 即使请求成功，敏感字段也不应该被更新
      expect(response.status).toBe(200);
      
      // 验证敏感字段没有被更新
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser?.phoneNumber).toBe('13800139999'); // 原值
      expect(updatedUser?.idCard).toBe('110101199001012222'); // 原值
    });
  });

  describe('PUT /api/user/password', () => {
    it('应该成功修改密码', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456'
      };

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码修改成功');

      // 验证新密码是否生效
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      const isNewPasswordValid = await bcrypt.compare('newpassword456', updatedUser!.passwordHash);
      expect(isNewPasswordValid).toBe(true);
    });

    it('应该在当前密码错误时返回400错误', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword789',
        confirmPassword: 'newpassword789'
      };

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('当前密码错误');
    });

    it('应该在新密码确认不匹配时返回400错误', async () => {
      const passwordData = {
        currentPassword: 'newpassword456', // 使用上面更新后的密码
        newPassword: 'anotherpassword',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码确认不匹配');
    });

    it('应该验证新密码强度', async () => {
      const passwordData = {
        currentPassword: 'newpassword456',
        newPassword: '123', // 太短
        confirmPassword: '123'
      };

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码长度');
    });

    it('应该在缺少必需字段时返回400错误', async () => {
      const passwordData = {
        currentPassword: 'newpassword456',
        // 缺少 newPassword 和 confirmPassword
      };

      const response = await request(app)
        .put('/api/user/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/upload-avatar', () => {
    it('应该在没有文件上传时返回400错误', async () => {
      const response = await request(app)
        .post('/api/user/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件');
    });

    // 注意：文件上传测试需要 multer 中间件和实际文件
    // 这里只测试基本的错误情况，实际文件上传测试需要更复杂的设置
  });
});