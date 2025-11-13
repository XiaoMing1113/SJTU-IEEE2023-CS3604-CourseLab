import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validation';
import { authSchemas } from '../schemas/authSchemas';

const router = express.Router();
const authController = new AuthController();

// POST /api/auth/send-code - 发送验证码
router.post('/send-code', 
  validateRequest(authSchemas.sendCode),
  authController.sendVerificationCode
);

// POST /api/auth/register - 用户注册
router.post('/register',
  validateRequest(authSchemas.register),
  authController.register
);

// POST /api/auth/login - 用户登录
router.post('/login',
  validateRequest(authSchemas.login),
  authController.login
);

// POST /api/auth/refresh - 刷新Token
router.post('/refresh',
  validateRequest(authSchemas.refresh),
  authController.refreshToken
);

// POST /api/auth/logout - 用户登出
router.post('/logout',
  authController.logout
);

// POST /api/auth/reset-password - 重置密码
router.post('/reset-password',
  validateRequest(authSchemas.resetPassword),
  authController.resetPassword
);

export default router;