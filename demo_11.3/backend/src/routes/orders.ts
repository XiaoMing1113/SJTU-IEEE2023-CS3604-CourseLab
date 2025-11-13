/**
 * 订单相关路由
 * 处理订单创建、查询、管理等功能
 */

import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const orderController = new OrderController();

// 所有订单路由都需要认证
router.use(authMiddleware);

/**
 * 创建订单
 * POST /api/orders
 */
router.post('/', orderController.createOrder);

/**
 * 获取用户订单列表
 * GET /api/orders
 */
router.get('/', orderController.getUserOrders);

/**
 * 获取订单详情
 * GET /api/orders/:orderId
 */
router.get('/:orderId', orderController.getOrderDetail);

/**
 * 取消订单
 * PUT /api/orders/:orderId/cancel
 */
router.put('/:orderId/cancel', orderController.cancelOrder);

/**
 * 支付订单
 * POST /api/orders/:orderId/pay
 */
router.post('/:orderId/pay', orderController.payOrder);

export default router;