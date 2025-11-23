const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 模拟库存仍使用内存结构，订单持久化到数据库
const orders = new Map();
const ticketInventory = new Map();
const { Order } = require('../models/Order');
const { db } = require('../database/init');

// 初始化票务库存
const initializeInventory = () => {
  db.all('SELECT train_number, business_class, first_class, second_class, premium_sleeper, soft_sleeper, hard_sleeper, hard_seat FROM trains', [], (err, rows) => {
    if (err || !rows || rows.length === 0) {
      // 兜底：如果数据库不可用，则不做填充，保持已有内存初始化
      return;
    }
    rows.forEach(r => {
      const trainNumber = r.train_number;
      const pairs = [
        ['business', r.business_class], ['商务座', r.business_class],
        ['first', r.first_class], ['一等座', r.first_class],
        ['second', r.second_class], ['二等座', r.second_class],
        ['premium_sleeper', r.premium_sleeper],
        ['soft_sleeper', r.soft_sleeper], ['软卧', r.soft_sleeper],
        ['hard_sleeper', r.hard_sleeper], ['硬卧', r.hard_sleeper],
        ['hard_seat', r.hard_seat], ['硬座', r.hard_seat]
      ];
      pairs.forEach(([type, count]) => {
        if (count != null && count >= 0) {
          const key = `${trainNumber}_${type}`;
          if (!ticketInventory.has(key)) {
            ticketInventory.set(key, count);
          }
        }
      });
    });
  });
};

// 初始化库存
initializeInventory();

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '未授权' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret', (err, user) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权' 
      });
    }
    req.user = user;
    next();
  });
};

// 验证身份证号格式
function isValidIdNumber(idNumber) {
  return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(idNumber);
}

// 验证手机号格式
function isValidPhoneNumber(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// POST /api/orders
router.post('/', authenticateToken, async (req, res) => {
  const { trainNumber, date, from, to, passengers } = req.body;
  const userId = req.user.userId;

  // 验证必填参数
  if (!trainNumber || !date || !from || !to || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: '订单信息不完整' 
    });
  }

  // 验证乘车人信息
  for (const passenger of passengers) {
    if (!passenger.name || !passenger.idNumber || !passenger.seatType) {
      return res.status(400).json({ 
        success: false, 
        message: '乘客信息不完整' 
      });
    }

    if (!isValidIdNumber(passenger.idNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: '身份证号格式不正确' 
      });
    }
  }

  // 检查每个乘客的座位库存
  const seatRequests = {};
  for (const passenger of passengers) {
    const seatType = passenger.seatType;
    seatRequests[seatType] = (seatRequests[seatType] || 0) + 1;
  }

  // 验证库存
  for (const [seatType, count] of Object.entries(seatRequests)) {
    const inventoryKey = `${trainNumber}_${seatType}`;
    const availableSeats = ticketInventory.get(inventoryKey) || 0;
    
    if (availableSeats < count) {
      return res.status(400).json({ 
        success: false, 
        message: '余票不足' 
      });
    }
  }

  // 扣减库存
  for (const [seatType, count] of Object.entries(seatRequests)) {
    const inventoryKey = `${trainNumber}_${seatType}`;
    const availableSeats = ticketInventory.get(inventoryKey);
    ticketInventory.set(inventoryKey, availableSeats - count);
  }

  // 计算总金额
  const priceMap = {
    '商务座': 1748,
    '一等座': 933,
    '二等座': 553,
    '硬卧': 156,
    '软卧': 243,
    '硬座': 89,
    'business': 1748,
    'first': 933,
    'second': 553,
    'hard_sleeper': 156,
    'soft_sleeper': 243,
    'hard_seat': 89
  };
  
  let totalAmount = 0;
  for (const passenger of passengers) {
    totalAmount += priceMap[passenger.seatType] || 100;
  }

  // 创建订单
  try {
    const orderId = `ORDER${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const paymentDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await Order.create({
      orderId,
      userId,
      trainNumber,
      date,
      from,
      to,
      totalAmount,
      status: 'PENDING_PAYMENT',
      paymentDeadline
    });

    await Order.addPassengers(orderId, passengers);

    // 兼容旧逻辑：放入内存，供支付模块使用
    orders.set(orderId, {
      orderId,
      userId,
      trainNumber,
      date,
      from,
      to,
      passengers,
      totalAmount,
      status: 'PENDING_PAYMENT',
      paymentDeadline,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: {
        orderId,
        status: 'PENDING_PAYMENT',
        totalAmount,
        paymentDeadline
      }
    });
  } catch (e) {
    console.error('创建订单失败:', e);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

// GET /api/orders/:orderId
router.get('/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;
  try {
    const order = await Order.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权访问此订单' });
    }

    const responseData = {
      orderId: order.orderId,
      status: order.status,
      trainInfo: {
        trainNumber: order.trainNumber,
        date: order.date,
        from: order.from,
        to: order.to
      },
      passengers: order.passengers,
      totalAmount: order.totalAmount,
      paymentDeadline: order.paymentDeadline,
      createdAt: order.createdAt
    };

    if (order.status === 'PAID' && order.ticketInfo) {
      responseData.ticketInfo = order.ticketInfo;
    }

    res.json({ success: true, data: responseData });
  } catch (e) {
    console.error('获取订单失败:', e);
    res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

// POST /api/orders/:orderId/cancel
router.post('/:orderId/cancel', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;
  try {
    const order = await Order.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权访问此订单' });
    }
    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ success: false, message: '订单状态不允许取消' });
    }

    // 恢复库存
    const seatRequests = {};
    for (const passenger of order.passengers) {
      const seatType = passenger.seatType;
      seatRequests[seatType] = (seatRequests[seatType] || 0) + 1;
    }
    for (const [seatType, count] of Object.entries(seatRequests)) {
      const inventoryKey = `${order.trainNumber}_${seatType}`;
      const currentInventory = ticketInventory.get(inventoryKey) || 0;
      ticketInventory.set(inventoryKey, currentInventory + count);
    }

    await Order.updateStatus(orderId, 'CANCELLED');
    // 兼容旧逻辑：同步内存
    const mem = orders.get(orderId);
    if (mem) {
      mem.status = 'CANCELLED';
      orders.set(orderId, mem);
    }

    res.json({ success: true, message: '订单取消成功' });
  } catch (e) {
    console.error('取消订单失败:', e);
    res.status(500).json({ success: false, message: '取消订单失败' });
  }
});

// GET /api/orders/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { status, page = 1, pageSize = 10 } = req.query;

  // 检查用户权限
  if (req.user.userId !== userId) {
    return res.status(403).json({ 
      success: false, 
      message: '无权访问此用户的订单' 
    });
  }

  try {
    const result = await Order.listByUser(userId, { status, page, pageSize });
    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    console.error('获取用户订单列表失败:', e);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

module.exports = router;
module.exports.orders = orders;

// 退票（已支付订单取消并恢复库存）
router.post('/:orderId/refund', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;

  try {
    const order = await Order.getById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: '无权访问此订单' });
    }
    if (order.status !== 'PAID') {
      return res.status(400).json({ success: false, message: '仅支持已支付订单退票' });
    }

    // 恢复库存
    const seatRequests = {};
    for (const passenger of order.passengers) {
      const seatType = passenger.seatType;
      seatRequests[seatType] = (seatRequests[seatType] || 0) + 1;
    }
    for (const [seatType, count] of Object.entries(seatRequests)) {
      const inventoryKey = `${order.trainNumber}_${seatType}`;
      const currentInventory = ticketInventory.get(inventoryKey) || 0;
      ticketInventory.set(inventoryKey, currentInventory + count);
    }

    await Order.updateStatus(orderId, 'CANCELLED');
    const mem = orders.get(orderId);
    if (mem) {
      mem.status = 'CANCELLED';
      orders.set(orderId, mem);
    }

    res.json({ success: true, message: '退票成功' });
  } catch (e) {
    console.error('退票失败:', e);
    res.status(500).json({ success: false, message: '退票失败' });
  }
});
