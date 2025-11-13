/**
 * 12306 Demo 数据库种子文件
 * 用于初始化测试数据和基础数据
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库种子数据...');

  // 清理现有数据（测试环境）
  if (process.env.NODE_ENV === 'test') {
    console.log('🧹 清理测试数据...');
    await prisma.orderPassenger.deleteMany();
    await prisma.order.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.train.deleteMany();
    await prisma.user.deleteMany();
  }

  // 创建测试用户
  console.log('👤 创建测试用户...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const testUsers = await Promise.all([
    prisma.user.create({
      data: {
        phoneNumber: '13800138001',
        idCard: '110101199001011234',
        username: '张三',
        passwordHash: hashedPassword,
        loginAttempts: 0,
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '13800138002',
        idCard: '110101199002022345',
        username: '李四',
        passwordHash: hashedPassword,
        loginAttempts: 0,
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '13800138003',
        idCard: '110101199003033456',
        username: '王五',
        passwordHash: hashedPassword,
        loginAttempts: 0,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${testUsers.length} 个测试用户`);

  // 创建测试乘车人
  console.log('🚶 创建测试乘车人...');
  const testPassengers = await Promise.all([
    // 张三的乘车人
    prisma.passenger.create({
      data: {
        userId: testUsers[0].id,
        name: '张三',
        idCard: '110101199001011234',
        phone: '13800138001',
      },
    }),
    prisma.passenger.create({
      data: {
        userId: testUsers[0].id,
        name: '张小明',
        idCard: '110101201001011234',
        phone: '13800138011',
      },
    }),
    // 李四的乘车人
    prisma.passenger.create({
      data: {
        userId: testUsers[1].id,
        name: '李四',
        idCard: '110101199002022345',
        phone: '13800138002',
      },
    }),
    // 王五的乘车人
    prisma.passenger.create({
      data: {
        userId: testUsers[2].id,
        name: '王五',
        idCard: '110101199003033456',
        phone: '13800138003',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${testPassengers.length} 个测试乘车人`);

  // 创建测试列车
  console.log('🚄 创建测试列车...');
  const testTrains = await Promise.all([
    prisma.train.create({
      data: {
        trainNumber: 'G1',
        trainType: 'G',
        departureCity: '北京',
        arrivalCity: '上海',
        departureTime: '08:00',
        arrivalTime: '12:28',
        duration: '4h28m',
      },
    }),
    prisma.train.create({
      data: {
        trainNumber: 'G2',
        trainType: 'G',
        departureCity: '上海',
        arrivalCity: '北京',
        departureTime: '09:00',
        arrivalTime: '13:28',
        duration: '4h28m',
      },
    }),
    prisma.train.create({
      data: {
        trainNumber: 'D1',
        trainType: 'D',
        departureCity: '北京',
        arrivalCity: '天津',
        departureTime: '07:30',
        arrivalTime: '08:30',
        duration: '1h00m',
      },
    }),
    prisma.train.create({
      data: {
        trainNumber: 'K1',
        trainType: 'K',
        departureCity: '北京',
        arrivalCity: '西安',
        departureTime: '20:30',
        arrivalTime: '08:42',
        duration: '12h12m',
      },
    }),
    prisma.train.create({
      data: {
        trainNumber: 'G101',
        trainType: 'G',
        departureCity: '北京',
        arrivalCity: '济南',
        departureTime: '10:15',
        arrivalTime: '11:27',
        duration: '1h12m',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${testTrains.length} 个测试列车`);

  // 创建测试订单
  console.log('📋 创建测试订单...');
  const testOrders = await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'E240001001',
        userId: testUsers[0].id,
        trainId: testTrains[0].id,
        departureDate: new Date('2024-12-01'),
        seatType: 'secondClass',
        totalAmount: 553.0,
        status: 'PAID',
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'E240001002',
        userId: testUsers[1].id,
        trainId: testTrains[1].id,
        departureDate: new Date('2024-12-02'),
        seatType: 'firstClass',
        totalAmount: 1866.0,
        status: 'PENDING',
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'E240001003',
        userId: testUsers[0].id,
        trainId: testTrains[2].id,
        departureDate: new Date('2024-12-03'),
        seatType: 'secondClass',
        totalAmount: 54.5,
        status: 'CANCELLED',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${testOrders.length} 个测试订单`);

  // 创建订单乘车人关联
  console.log('🔗 创建订单乘车人关联...');
  const orderPassengers = await Promise.all([
    prisma.orderPassenger.create({
      data: {
        orderId: testOrders[0].id,
        passengerId: testPassengers[0].id,
        seatNumber: '01A',
      },
    }),
    prisma.orderPassenger.create({
      data: {
        orderId: testOrders[1].id,
        passengerId: testPassengers[2].id,
        seatNumber: '02A',
      },
    }),
    prisma.orderPassenger.create({
      data: {
        orderId: testOrders[1].id,
        passengerId: testPassengers[2].id,
        seatNumber: '02B',
      },
    }),
    prisma.orderPassenger.create({
      data: {
        orderId: testOrders[2].id,
        passengerId: testPassengers[0].id,
        seatNumber: '03A',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${orderPassengers.length} 个订单乘车人关联`);

  // 输出统计信息
  console.log('\n📊 数据库种子数据初始化完成！');
  console.log('='.repeat(50));
  console.log(`👤 用户数量: ${testUsers.length}`);
  console.log(`🚶 乘车人数量: ${testPassengers.length}`);
  console.log(`🚄 列车数量: ${testTrains.length}`);
  console.log(`📋 订单数量: ${testOrders.length}`);
  console.log(`🔗 订单乘车人关联: ${orderPassengers.length}`);
  console.log('='.repeat(50));

  // 输出测试账号信息
  console.log('\n🔑 测试账号信息:');
  testUsers.forEach((user, index) => {
    console.log(`${index + 1}. 手机号: ${user.phoneNumber}, 密码: 123456, 姓名: ${user.username}`);
  });

  console.log('\n✅ 种子数据初始化完成，可以开始测试了！');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });