import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

// 扩展Request接口，添加用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phoneNumber: string;
        username: string;
      };
    }
  }
}

const authService = new AuthService();

/**
 * JWT认证中间件
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: 实现JWT认证逻辑
    // 1. 从请求头获取Token
    // 2. 验证Token有效性
    // 3. 解析用户信息
    // 4. 将用户信息添加到req.user
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        errorCode: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证Token（当前为模拟实现）
    if (token === 'mock-jwt-token') {
      req.user = {
        userId: 'user-123',
        phoneNumber: '13800138000',
        username: '测试用户'
      };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效',
        errorCode: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证失败',
      errorCode: 'AUTH_FAILED'
    });
  }
};

/**
 * 可选认证中间件（用户可能已登录也可能未登录）
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // TODO: 验证Token，如果有效则设置用户信息
      if (token === 'mock-jwt-token') {
        req.user = {
          userId: 'user-123',
          phoneNumber: '13800138000',
          username: '测试用户'
        };
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不阻止请求继续
    next();
  }
};