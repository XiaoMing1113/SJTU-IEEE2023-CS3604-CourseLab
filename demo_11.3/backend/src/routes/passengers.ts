/**
 * 乘客相关路由
 * 处理乘客信息管理功能
 */

import { Router } from 'express';
import { PassengerController } from '../controllers/PassengerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const passengerController = new PassengerController();

// 所有乘客路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户乘客列表
 * GET /api/passengers
 */
router.get('/', passengerController.getUserPassengers);

/**
 * 添加乘客
 * POST /api/passengers
 */
router.post('/', passengerController.addPassenger);

/**
 * 更新乘客信息
 * PUT /api/passengers/:passengerId
 */
router.put('/:passengerId', passengerController.updatePassenger);

/**
 * 删除乘客
 * DELETE /api/passengers/:passengerId
 */
router.delete('/:passengerId', passengerController.deletePassenger);

/**
 * 获取乘客详情
 * GET /api/passengers/:passengerId
 */
router.get('/:passengerId', passengerController.getPassengerDetail);

export default router;