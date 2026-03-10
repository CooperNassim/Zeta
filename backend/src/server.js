require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 确保备份目录存在
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,  // 允许所有来源，方便开发
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 静态文件服务（备份文件）
app.use('/backups', express.static(backupDir));

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

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Zeta Trading System Backend       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Backup directory: ${backupDir}`);
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
