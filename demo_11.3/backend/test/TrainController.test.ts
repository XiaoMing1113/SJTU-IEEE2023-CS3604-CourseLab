/**
 * TrainController 单元测试
 * 测试列车相关API的业务逻辑
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { TrainController } from '../src/controllers/TrainController';
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

const trainController = new TrainController();

// 设置路由
app.get('/api/trains/search', trainController.searchTrains);
app.get('/api/trains/:id', trainController.getTrainDetail);
app.get('/api/trains/:id/seats', trainController.getTrainSeats);
app.use(errorHandler);

describe('TrainController', () => {
  beforeAll(async () => {
    await prisma.$connect();
    
    // 清理测试数据
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.trainSeat.deleteMany();
    await prisma.train.deleteMany();
    
    // 创建测试列车数据
    const testTrain = await prisma.train.create({
      data: {
        trainNumber: 'G1001',
        trainType: 'G',
        departureCity: '北京',
        arrivalCity: '上海',
        departureTime: '08:00',
        arrivalTime: '12:28',
        duration: '4h28m',
      },
    });

    // 创建座位信息
    await prisma.trainSeat.createMany({
      data: [
        {
          trainId: testTrain.id,
          seatType: '商务座',
          totalSeats: 20,
          availableSeats: 18,
          price: 1748.0,
        },
        {
          trainId: testTrain.id,
          seatType: '一等座',
          totalSeats: 60,
          availableSeats: 45,
          price: 933.0,
        },
        {
          trainId: testTrain.id,
          seatType: '二等座',
          totalSeats: 200,
          availableSeats: 156,
          price: 553.0,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.trainSeat.deleteMany();
    await prisma.train.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/trains/search', () => {
    it('应该返回符合条件的列车列表', async () => {
      const response = await request(app)
        .get('/api/trains/search')
        .query({
          departureCity: '北京',
          arrivalCity: '上海',
          departureDate: '2024-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trains');
      expect(Array.isArray(response.body.data.trains)).toBe(true);
      
      if (response.body.data.trains.length > 0) {
        const train = response.body.data.trains[0];
        expect(train).toHaveProperty('trainNumber');
        expect(train).toHaveProperty('departureCity', '北京');
        expect(train).toHaveProperty('arrivalCity', '上海');
        expect(train).toHaveProperty('seats');
      }
    });

    it('应该在缺少必需参数时返回400错误', async () => {
      const response = await request(app)
        .get('/api/trains/search')
        .query({
          departureCity: '北京'
          // 缺少 arrivalCity 和 departureDate
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('参数');
    });

    it('应该在没有找到列车时返回空列表', async () => {
      const response = await request(app)
        .get('/api/trains/search')
        .query({
          departureCity: '不存在的城市',
          arrivalCity: '另一个不存在的城市',
          departureDate: '2024-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trains).toHaveLength(0);
    });
  });

  describe('GET /api/trains/:id', () => {
    it('应该返回指定列车的详细信息', async () => {
      // 先获取一个列车ID
      const trains = await prisma.train.findMany();
      const trainId = trains[0].id;

      const response = await request(app)
        .get(`/api/trains/${trainId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('train');
      
      const train = response.body.data.train;
      expect(train).toHaveProperty('id', trainId);
      expect(train).toHaveProperty('trainNumber');
      expect(train).toHaveProperty('seats');
      expect(Array.isArray(train.seats)).toBe(true);
    });

    it('应该在列车不存在时返回404错误', async () => {
      const response = await request(app)
        .get('/api/trains/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('列车不存在');
    });
  });

  describe('GET /api/trains/:id/seats', () => {
    it('应该返回指定列车的座位信息', async () => {
      // 先获取一个列车ID
      const trains = await prisma.train.findMany();
      const trainId = trains[0].id;

      const response = await request(app)
        .get(`/api/trains/${trainId}/seats`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('seats');
      
      const seats = response.body.data.seats;
      expect(Array.isArray(seats)).toBe(true);
      expect(seats.length).toBeGreaterThan(0);
      
      const seat = seats[0];
      expect(seat).toHaveProperty('seatType');
      expect(seat).toHaveProperty('totalSeats');
      expect(seat).toHaveProperty('availableSeats');
      expect(seat).toHaveProperty('price');
    });

    it('应该在列车不存在时返回404错误', async () => {
      const response = await request(app)
        .get('/api/trains/nonexistent-id/seats');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('列车不存在');
    });
  });
});