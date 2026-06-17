const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 确保备份目录存在
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 安全中间件
app.use(helmet());
app.use(compression());

// CORS 配置 - 生产环境严格限制
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// 速率限制 - 防止 DoS 攻击
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: NODE_ENV === 'production' ? 1000 : 5000, // 开发环境限制为5000次
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口独立速率限制 - 防止暴力破解
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分钟
  max: 15, // 5 分钟内最多 15 次登录尝试
  message: { error: '登录尝试次数过多，请 5 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/health', apiLimiter);

// 解析请求体
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 请求日志
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 注意：已移除 /backups 静态文件服务，防止备份文件泄露
// 如果需要备份功能，请添加认证中间件

// API路由
// 注意：用户管理路由必须在通用CRUD路由之前注册，否则 /api/users 会被 /api/:table 匹配
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

app.use('/api', require('./routes/api'));

// 认证路由（应用登录速率限制）
const authRoutes = require('./routes/auth');
app.use('/api/auth', loginLimiter, authRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 数据库连接检查（需要认证）
const { authenticateToken } = require('./middleware/auth');
app.get('/health/db', authenticateToken, async (req, res) => {
  const connected = await testConnection();
  if (connected) {
    res.json({ status: 'ok', database: 'connected' });
  } else {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理 - 生产环境不泄露错误详情
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

// 启动服务器
app.listen(PORT, async () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Zeta Trading System Backend       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log('');

  // 测试数据库连接
  const connected = await testConnection();
  if (connected) {
    console.log('✅ Backend is ready to accept requests!');
  } else {
    console.log('⚠️  Warning: Database connection failed. Check your .env configuration.');
  }
});

module.exports = app;
