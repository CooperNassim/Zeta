const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config();

// 创建数据库连接池
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '960717',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading'
});

async function runMigration() {
  console.log('🚀 开始数据库迁移...');

  try {
    // 测试连接
    await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功');

    // 读取迁移SQL文件
    const sqlPath = path.join(__dirname, '../../migrations/migration_complete_v3.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 读取迁移SQL文件成功');

    // 执行SQL
    await pool.query(sql);

    console.log('✅ 数据库迁移完成！');
    console.log('\n📊 已创建/更新的表:');
    console.log('  - account');
    console.log('  - account_risk_data');
    console.log('  - daily_work_data');
    console.log('  - orders');
    console.log('  - psychological_indicators (旧的1-100分指标，已弃用)');
    console.log('  - psychological_test_indicators (新的0-2分测试问题配置)');
    console.log('  - psychological_test_results');
    console.log('  - risk_config');
    console.log('  - risk_models');
    console.log('  - scheduled_orders');
    console.log('  - stock_kline_data');
    console.log('  - stock_pool');
    console.log('  - strategy_records');
    console.log('  - technical_indicators');
    console.log('  - trade_records');
    console.log('  - trading_strategies');
    console.log('  - transactions');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    if (error.detail) {
      console.error('详细错误:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n👋 数据库连接已关闭');
  }
}

runMigration();
