/**
 * 全局错误处理中间件
 * 统一处理应用程序中的错误
 */

import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 默认错误状态码
  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';

  // 处理特定类型的错误
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token无效';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token已过期';
  } else if (error.code === 'P2002') {
    // Prisma 唯一约束错误
    statusCode = 409;
    message = '数据已存在';
  } else if (error.code === 'P2025') {
    // Prisma 记录不存在错误
    statusCode = 404;
    message = '记录不存在';
  }

  // 开发环境返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack
    })
  });
};

/**
 * 404 错误处理中间件
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`
  });
};

/**
 * 异步错误包装器
 * 用于包装异步路由处理器，自动捕获错误
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};