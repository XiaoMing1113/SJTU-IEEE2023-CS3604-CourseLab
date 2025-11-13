/**
 * 请求验证中间件
 * 使用 Joi 进行请求数据验证
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * 验证请求数据的中间件工厂函数
 * @param schema Joi验证模式
 * @returns Express中间件函数
 */
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 合并所有需要验证的数据
    const dataToValidate = {
      ...req.body,
      ...req.query,
      ...req.params
    };

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // 返回所有验证错误
      allowUnknown: true, // 允许未知字段
      stripUnknown: true  // 移除未知字段
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: errorMessages
      });
    }

    // 将验证后的数据重新赋值给请求对象
    Object.assign(req.body, value);
    next();
  };
};

/**
 * 验证查询参数的中间件工厂函数
 * @param schema Joi验证模式
 * @returns Express中间件函数
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: '查询参数验证失败',
        errors: errorMessages
      });
    }

    req.query = value;
    next();
  };
};

/**
 * 验证路径参数的中间件工厂函数
 * @param schema Joi验证模式
 * @returns Express中间件函数
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: '路径参数验证失败',
        errors: errorMessages
      });
    }

    req.params = value;
    next();
  };
};