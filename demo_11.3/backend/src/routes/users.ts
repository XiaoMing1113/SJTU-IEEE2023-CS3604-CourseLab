/**
 * 用户相关路由
 * 处理用户信息管理功能
 */

import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// 所有用户路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户信息
 * GET /api/users/profile
 */
router.get('/profile', userController.getUserProfile);

/**
 * 更新用户信息
 * PUT /api/users/profile
 */
router.put('/profile', userController.updateUserProfile);

/**
 * 修改密码
 * PUT /api/users/password
 */
router.put('/password', userController.changePassword);

/**
 * 上传头像
 * POST /api/users/avatar
 */
router.post('/avatar', userController.uploadAvatar);

export default router;