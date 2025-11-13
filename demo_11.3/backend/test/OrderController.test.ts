/**
 * OrderController 单元测试
 * 测试订单相关API的业务逻辑
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OrderController } from '../src/controllers/OrderController';
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

const orderController = new OrderController();

// 设置路由
app.post('/api/orders', authMiddleware, orderController.createOrder);
app.get('/api/orders', authMiddleware, orderController.getUserOrders);
app.get('/api/orders/:id', authMiddleware, orderController.getOrderDetail);
app.put('/api/orders/:id/cancel', authMiddleware, orderController.cancelOrder);
app.put('/api/orders/:id/pay', authMiddleware, orderController.payOrder);
app.use(errorHandler);

describe('OrderController', () => {
  let testUser: any;
  let testTrain: any;
  let testPassenger: any;
  let authToken: string;

  beforeAll(async () => {
    await prisma.$connect();
    
    // 清理测试数据
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.trainSeat.deleteMany();
    await prisma.train.deleteMany();
    await prisma.user.deleteMany();
    
    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        phoneNumber: '13800138888',
        idCard: '110101199001011111',
        username: '测试用户',
        passwordHash: 'hashedpassword',
      },
    });

    // 创建测试列车
    testTrain = await prisma.train.create({
      data: {
        trainNumber: 'G2001',
        trainType: 'G',
        departureCity: '北京',
        arrivalCity: '上海',
        departureTime: '09:00',
        arrivalTime: '13:28',
        duration: '4h28m',
      },
    });

    // 创建座位信息
    await prisma.trainSeat.create({
      data: {
        trainId: testTrain.id,
        seatType: '二等座',
        totalSeats: 100,
        availableSeats: 80,
        price: 553.0,
      },
    });

    // 创建测试乘客
    testPassenger = await prisma.passenger.create({
      data: {
        userId: testUser.id,
        name: '测试乘客',
        idCard: '110101199001011111',
        phone: '13800138888',
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
    await prisma.trainSeat.deleteMany();
    await prisma.train.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('应该成功创建订单', async () => {
      const orderData = {
        trainId: testTrain.id,
        seatType: '二等座',
        departureDate: '2024-01-15',
        passengers: [
          {
            passengerId: testPassenger.id,
            name: '测试乘客',
            idCard: '110101199001011111'
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      
      const order = response.body.data.order;
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('status', 'PENDING');
      expect(order).toHaveProperty('totalAmount');
      expect(order.totalAmount).toBe(553.0);
    });

    it('应该在缺少认证token时返回401错误', async () => {
      const orderData = {
        trainId: testTrain.id,
        seatType: '二等座',
        departureDate: '2024-01-15',
        passengers: [{ passengerId: testPassenger.id }]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('应该在座位不足时返回400错误', async () => {
      // 先将座位设为0
      await prisma.trainSeat.updateMany({
        where: { trainId: testTrain.id },
        data: { availableSeats: 0 }
      });

      const orderData = {
        trainId: testTrain.id,
        seatType: '二等座',
        departureDate: '2024-01-15',
        passengers: [{ passengerId: testPassenger.id }]
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('座位不足');

      // 恢复座位数量
      await prisma.trainSeat.updateMany({
        where: { trainId: testTrain.id },
        data: { availableSeats: 80 }
      });
    });
  });

  describe('GET /api/orders', () => {
    it('应该返回用户的订单列表', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    it('应该支持分页查询', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('应该返回指定订单的详细信息', async () => {
      // 先创建一个订单
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          trainId: testTrain.id,
          orderNumber: 'TEST' + Date.now(),
          status: 'PENDING',
          totalAmount: 553.0,
          seatType: '二等座',
          departureDate: new Date('2024-01-15'),
        },
      });

      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      
      const orderDetail = response.body.data.order;
      expect(orderDetail).toHaveProperty('id', order.id);
      expect(orderDetail).toHaveProperty('orderNumber');
      expect(orderDetail).toHaveProperty('train');
      expect(orderDetail).toHaveProperty('passengers');
    });

    it('应该在订单不存在时返回404错误', async () => {
      const response = await request(app)
        .get('/api/orders/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('订单不存在');
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('应该成功取消订单', async () => {
      // 先创建一个订单
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          trainId: testTrain.id,
          orderNumber: 'CANCEL' + Date.now(),
          status: 'PENDING',
          totalAmount: 553.0,
          seatType: '二等座',
          departureDate: new Date('2024-01-15'),
        },
      });

      const response = await request(app)
        .put(`/api/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('CANCELLED');
    });

    it('应该在订单已支付时拒绝取消', async () => {
      // 创建已支付的订单
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          trainId: testTrain.id,
          orderNumber: 'PAID' + Date.now(),
          status: 'PAID',
          totalAmount: 553.0,
          seatType: '二等座',
          departureDate: new Date('2024-01-15'),
        },
      });

      const response = await request(app)
        .put(`/api/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无法取消');
    });
  });

  describe('PUT /api/orders/:id/pay', () => {
    it('应该成功支付订单', async () => {
      // 先创建一个待支付订单
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          trainId: testTrain.id,
          orderNumber: 'PAY' + Date.now(),
          status: 'PENDING',
          totalAmount: 553.0,
          seatType: '二等座',
          departureDate: new Date('2024-01-15'),
        },
      });

      const response = await request(app)
        .put(`/api/orders/${order.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'alipay' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('PAID');
    });

    it('应该在订单已取消时拒绝支付', async () => {
      // 创建已取消的订单
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          trainId: testTrain.id,
          orderNumber: 'CANCELLED' + Date.now(),
          status: 'CANCELLED',
          totalAmount: 553.0,
          seatType: '二等座',
          departureDate: new Date('2024-01-15'),
        },
      });

      const response = await request(app)
        .put(`/api/orders/${order.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'alipay' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无法支付');
    });
  });
});