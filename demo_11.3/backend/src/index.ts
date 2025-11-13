import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// 导入路由
import authRoutes from './routes/auth';
import trainRoutes from './routes/trains';
import orderRoutes from './routes/orders';
import passengerRoutes from './routes/passengers';
import userRoutes from './routes/users';

// 导入中间件
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/passengers', authMiddleware, passengerRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// 静态文件服务（用户上传的文件）
app.use('/uploads', express.static('uploads'));

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    errorCode: 'NOT_FOUND'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  });
}

export default app;