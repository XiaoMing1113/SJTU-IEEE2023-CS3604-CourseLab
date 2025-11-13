/**
 * 列车相关路由
 * 处理列车查询、车次信息等功能
 */

import { Router } from 'express';
import { TrainController } from '../controllers/TrainController';

const router = Router();
const trainController = new TrainController();

/**
 * 查询列车
 * GET /api/trains/search
 */
router.get('/search', trainController.searchTrains);

/**
 * 获取列车详情
 * GET /api/trains/:trainId
 */
router.get('/:trainId', trainController.getTrainDetail);

/**
 * 获取列车座位信息
 * GET /api/trains/:trainId/seats
 */
router.get('/:trainId/seats', trainController.getTrainSeats);

export default router;