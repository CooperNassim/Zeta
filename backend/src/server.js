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
    if (NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
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
  max: NODE_ENV === 'production' ? 1000 : 20000, // 开发环境放宽到20000次
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/health', apiLimiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 注意：已移除 /backups 静态文件服务，防止备份文件泄露
// 如果需要备份功能，请添加认证中间件

// API路由
app.use('/api', require('./routes/api'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 数据库连接检查
app.get('/health/db', async (req, res) => {
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

    // 初始化定时任务调度器
    try {
      const { initScheduler } = require('./utils/scheduler')
      await initScheduler()
      console.log('✅ Scheduler initialized successfully');
    } catch (err) {
      console.error('⚠️  Scheduler initialization failed:', err.message);
    }
  } else {
    console.log('⚠️  Warning: Database connection failed. Check your .env configuration.');
  }
});

module.exports = app;
