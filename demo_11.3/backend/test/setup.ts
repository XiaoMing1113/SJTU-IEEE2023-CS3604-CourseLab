import { PrismaClient } from '@prisma/client';

declare global {
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
}

// 全局测试设置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.sqlite'
    }
  }
});

// 测试前设置
beforeAll(async () => {
  // 初始化测试数据库
  await prisma.$connect();
  
  // 使用更简单的方法：直接使用主数据库的副本
  // 首先检查主数据库是否存在，如果不存在则创建
  try {
    // 尝试使用Prisma的db push来创建表结构
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    
    // 创建必要的表（简化版本，只包含Auth测试需要的表）
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phoneNumber TEXT UNIQUE NOT NULL,
        idCard TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        loginAttempts INTEGER DEFAULT 0,
        lockedUntil DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        phoneNumber TEXT NOT NULL,
        code TEXT NOT NULL,
        codeType TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  } catch (error) {
    console.warn('数据库表创建失败，可能已经存在:', error);
  }
});

// 每个测试后清理
afterEach(async () => {
  // 清理测试数据 - 使用与beforeAll相同的表名
  const tables = ['users', 'passengers', 'trains', 'train_seats', 'orders', 'order_passengers', 'verification_codes'];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
    } catch (error) {
      // 表可能不存在，忽略错误
    }
  }
});

// 测试结束后断开连接
afterAll(async () => {
  await prisma.$disconnect();
});

// 导出prisma实例供测试使用
export { prisma };

// 测试工具函数
export const testUtils = {
  // 创建测试用户
  async createTestUser(userData?: Partial<any>) {
    const userId = userData?.id || `test-user-${Date.now()}`;
    const phoneNumber = userData?.phoneNumber || '13800138000';
    const idCard = userData?.idCard || '110101199001011234';
    const username = userData?.username || '测试用户';
    const passwordHash = userData?.passwordHash || 'hashed-password';
    
    await prisma.$executeRaw`
      INSERT INTO users (id, phoneNumber, idCard, username, passwordHash, createdAt, updatedAt, loginAttempts, lockedUntil)
      VALUES (${userId}, ${phoneNumber}, ${idCard}, ${username}, ${passwordHash}, datetime('now'), datetime('now'), ${userData?.loginAttempts || 0}, ${userData?.lockedUntil || null})
    `;
    
    return { id: userId, phoneNumber, idCard, username, passwordHash };
  },

  // 创建测试车次
  async createTestTrain(trainData?: Partial<any>) {
    const trainId = trainData?.id || `test-train-${Date.now()}`;
    const trainNumber = trainData?.trainNumber || 'G1001';
    const trainType = trainData?.trainType || 'G';
    const departureCity = trainData?.departureCity || '北京';
    const arrivalCity = trainData?.arrivalCity || '上海';
    const departureTime = trainData?.departureTime || '08:00';
    const arrivalTime = trainData?.arrivalTime || '12:30';
    const duration = trainData?.duration || '4小时30分';
    
    await prisma.$executeRaw`
      INSERT INTO trains (id, trainNumber, trainType, departureCity, arrivalCity, departureTime, arrivalTime, duration)
      VALUES (${trainId}, ${trainNumber}, ${trainType}, ${departureCity}, ${arrivalCity}, ${departureTime}, ${arrivalTime}, ${duration})
    `;
    
    return { id: trainId, trainNumber, trainType, departureCity, arrivalCity, departureTime, arrivalTime, duration };
  },

  // 创建测试验证码
  async createTestVerificationCode(codeData?: Partial<any>) {
    const codeId = codeData?.id || `test-code-${Date.now()}`;
    const phoneNumber = codeData?.phoneNumber || '13800138000';
    const code = codeData?.code || '123456';
    const codeType = codeData?.codeType || 'register';
    const expiresAt = codeData?.expiresAt || new Date(Date.now() + 5 * 60 * 1000);
    const used = codeData?.used || false;
    
    await prisma.$executeRaw`
      INSERT INTO verification_codes (id, phoneNumber, code, codeType, expiresAt, used, createdAt)
      VALUES (${codeId}, ${phoneNumber}, ${code}, ${codeType}, ${expiresAt.toISOString()}, ${used}, datetime('now'))
    `;
    
    return { id: codeId, phoneNumber, code, codeType, expiresAt, used };
  }
};