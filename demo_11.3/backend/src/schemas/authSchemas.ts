/**
 * 认证相关的数据验证模式
 * 使用 Joi 定义各种认证接口的数据验证规则
 */

import Joi from 'joi';

// 手机号验证规则
const phoneSchema = Joi.string()
  .pattern(/^1[3-9]\d{9}$/)
  .required()
  .messages({
    'string.pattern.base': '请输入有效的手机号码',
    'any.required': '手机号码不能为空'
  });

// 邮箱验证规则
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱地址不能为空'
  });

// 密码验证规则
const passwordSchema = Joi.string()
  .min(6)
  .max(20)
  .pattern(/^(?=.*[a-zA-Z])(?=.*\d)/)
  .required()
  .messages({
    'string.min': '密码长度至少6位',
    'string.max': '密码长度不能超过20位',
    'string.pattern.base': '密码必须包含字母和数字',
    'any.required': '密码不能为空'
  });

// 验证码验证规则
const verificationCodeSchema = Joi.string()
  .length(6)
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    'string.length': '验证码必须是6位数字',
    'string.pattern.base': '验证码必须是6位数字',
    'any.required': '验证码不能为空'
  });

// 用户名验证规则
const usernameSchema = Joi.string()
  .min(2)
  .max(20)
  .pattern(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/)
  .required()
  .messages({
    'string.min': '用户名长度至少2位',
    'string.max': '用户名长度不能超过20位',
    'string.pattern.base': '用户名只能包含中文、字母、数字和下划线',
    'any.required': '用户名不能为空'
  });

/**
 * 发送验证码接口验证模式
 */
export const sendCodeSchema = Joi.object({
  phone: phoneSchema,
  type: Joi.string()
    .valid('register', 'login', 'reset_password')
    .required()
    .messages({
      'any.only': '验证码类型无效',
      'any.required': '验证码类型不能为空'
    })
});

/**
 * 用户注册接口验证模式
 */
export const registerSchema = Joi.object({
  username: usernameSchema,
  phone: phoneSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '确认密码与密码不一致',
      'any.required': '确认密码不能为空'
    }),
  verificationCode: verificationCodeSchema,
  realName: Joi.string()
    .min(2)
    .max(10)
    .pattern(/^[\u4e00-\u9fa5]+$/)
    .required()
    .messages({
      'string.min': '真实姓名长度至少2位',
      'string.max': '真实姓名长度不能超过10位',
      'string.pattern.base': '真实姓名只能包含中文',
      'any.required': '真实姓名不能为空'
    }),
  idNumber: Joi.string()
    .pattern(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/)
    .required()
    .messages({
      'string.pattern.base': '请输入有效的身份证号码',
      'any.required': '身份证号码不能为空'
    })
});

/**
 * 用户登录接口验证模式
 */
export const loginSchema = Joi.object({
  account: Joi.alternatives()
    .try(
      phoneSchema.messages({ 'any.required': '账号不能为空' }),
      emailSchema.messages({ 'any.required': '账号不能为空' }),
      usernameSchema.messages({ 'any.required': '账号不能为空' })
    )
    .required()
    .messages({
      'alternatives.match': '请输入有效的手机号、邮箱或用户名',
      'any.required': '账号不能为空'
    }),
  password: passwordSchema,
  verificationCode: verificationCodeSchema.optional(),
  loginType: Joi.string()
    .valid('password', 'sms')
    .default('password')
    .messages({
      'any.only': '登录类型无效'
    })
});

/**
 * 刷新Token接口验证模式
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': '刷新令牌不能为空'
    })
});

/**
 * 重置密码接口验证模式
 */
export const resetPasswordSchema = Joi.object({
  phone: phoneSchema,
  verificationCode: verificationCodeSchema,
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': '确认密码与新密码不一致',
      'any.required': '确认密码不能为空'
    })
});

/**
 * 导出所有验证模式
 */
export const authSchemas = {
  sendCode: sendCodeSchema,
  register: registerSchema,
  login: loginSchema,
  refresh: refreshTokenSchema,
  resetPassword: resetPasswordSchema
};