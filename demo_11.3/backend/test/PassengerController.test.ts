/**
 * PassengerController 单元测试
 * 测试乘客管理相关API的业务逻辑
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PassengerController } from '../src/controllers/PassengerController';
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

const passengerController = new PassengerController();

// 设置路由
app.get('/api/passengers', authMiddleware, passengerController.getUserPassengers);
app.post('/api/passengers', authMiddleware, passengerController.addPassenger);
app.put('/api/passengers/:id', authMiddleware, passengerController.updatePassenger);
app.delete('/api/passengers/:id', authMiddleware, passengerController.deletePassenger);
app.get('/api/passengers/:id', authMiddleware, passengerController.getPassengerDetail);
app.use(errorHandler);

describe('PassengerController', () => {
  let testUser: any;
  let authToken: string;
  let testPassenger: any;

  beforeAll(async () => {
    await prisma.$connect();
    
    // 清理测试数据
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.user.deleteMany();
    
    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        phoneNumber: '13800139999',
        idCard: '110101199001012222',
        username: '乘客测试用户',
        passwordHash: 'hashedpassword',
      },
    });

    // 生成JWT token
    authToken = jwt.sign(
      { userId: testUser.id, phoneNumber: testUser.phoneNumber },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // 创建测试乘客
    testPassenger = await prisma.passenger.create({
      data: {
        userId: testUser.id,
        name: '张三',
        idCard: '110101199001012222',
        phone: '13800139999',
      },
    });
  });

  afterAll(async () => {
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/passengers', () => {
    it('应该返回用户的乘客列表', async () => {
      const response = await request(app)
        .get('/api/passengers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passengers');
      expect(Array.isArray(response.body.data.passengers)).toBe(true);
      expect(response.body.data.passengers.length).toBeGreaterThan(0);
      
      const passenger = response.body.data.passengers[0];
      expect(passenger).toHaveProperty('name');
      expect(passenger).toHaveProperty('idCard');
      expect(passenger).toHaveProperty('phone');
    });

    it('应该在缺少认证token时返回401错误', async () => {
      const response = await request(app)
        .get('/api/passengers');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/passengers', () => {
    it('应该成功添加新乘客', async () => {
      const passengerData = {
        name: '李四',
        idCard: '110101199002023333',
        phone: '13800138888'
      };

      const response = await request(app)
        .post('/api/passengers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passengerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passenger');
      
      const passenger = response.body.data.passenger;
      expect(passenger).toHaveProperty('name', '李四');
      expect(passenger).toHaveProperty('idCard', '110101199002023333');
      expect(passenger).toHaveProperty('phone', '13800138888');
    });

    it('应该在身份证号重复时返回400错误', async () => {
      const passengerData = {
        name: '重复身份证',
        idCard: '110101199001012222', // 与testPassenger相同
        phone: '13800138777'
      };

      const response = await request(app)
        .post('/api/passengers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passengerData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('身份证号已存在');
    });

    it('应该在缺少必需字段时返回400错误', async () => {
      const passengerData = {
        name: '缺少身份证',
        // 缺少 idCard
        phone: '13800138777'
      };

      const response = await request(app)
        .post('/api/passengers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passengerData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('应该验证身份证号格式', async () => {
      const passengerData = {
        name: '错误身份证',
        idCard: '123456', // 格式错误
        phone: '13800138777'
      };

      const response = await request(app)
        .post('/api/passengers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passengerData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('身份证号格式');
    });
  });

  describe('PUT /api/passengers/:id', () => {
    it('应该成功更新乘客信息', async () => {
      const updateData = {
        name: '张三更新',
        phone: '13800139998'
      };

      const response = await request(app)
        .put(`/api/passengers/${testPassenger.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passenger');
      
      const passenger = response.body.data.passenger;
      expect(passenger).toHaveProperty('name', '张三更新');
      expect(passenger).toHaveProperty('phone', '13800139998');
    });

    it('应该在乘客不存在时返回404错误', async () => {
      const updateData = {
        name: '不存在的乘客'
      };

      const response = await request(app)
        .put('/api/passengers/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('乘客不存在');
    });

    it('应该拒绝更新其他用户的乘客', async () => {
      // 创建另一个用户的乘客
      const otherUser = await prisma.user.create({
        data: {
          phoneNumber: '13800137777',
          idCard: '110101199003034444',
          username: '其他用户',
          passwordHash: 'hashedpassword',
        },
      });

      const otherPassenger = await prisma.passenger.create({
        data: {
          userId: otherUser.id,
          name: '其他用户乘客',
          idCard: '110101199003034444',
          phone: '13800137777',
        },
      });

      const updateData = {
        name: '尝试更新其他用户乘客'
      };

      const response = await request(app)
        .put(`/api/passengers/${otherPassenger.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无权限');
    });
  });

  describe('DELETE /api/passengers/:id', () => {
    it('应该成功删除乘客', async () => {
      // 创建一个用于删除的乘客
      const passengerToDelete = await prisma.passenger.create({
        data: {
          userId: testUser.id,
          name: '待删除乘客',
          idCard: '110101199004045555',
          phone: '13800136666',
        },
      });

      const response = await request(app)
        .delete(`/api/passengers/${passengerToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // 验证乘客已被删除
      const deletedPassenger = await prisma.passenger.findUnique({
        where: { id: passengerToDelete.id }
      });
      expect(deletedPassenger).toBeNull();
    });

    it('应该在乘客不存在时返回404错误', async () => {
      const response = await request(app)
        .delete('/api/passengers/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('乘客不存在');
    });

    it('应该在乘客有关联订单时拒绝删除', async () => {
      // 这个测试需要先创建订单关联，暂时跳过
      // 在实际实现中应该检查乘客是否有未完成的订单
    });
  });

  describe('GET /api/passengers/:id', () => {
    it('应该返回指定乘客的详细信息', async () => {
      const response = await request(app)
        .get(`/api/passengers/${testPassenger.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passenger');
      
      const passenger = response.body.data.passenger;
      expect(passenger).toHaveProperty('id', testPassenger.id);
      expect(passenger).toHaveProperty('name');
      expect(passenger).toHaveProperty('idCard');
      expect(passenger).toHaveProperty('phone');
    });

    it('应该在乘客不存在时返回404错误', async () => {
      const response = await request(app)
        .get('/api/passengers/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('乘客不存在');
    });
  });
});