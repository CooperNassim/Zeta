require('dotenv').config();
const { pool, testConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🚀 Starting database initialization...');

  // 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check your .env configuration.');
    process.exit(1);
  }

  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded, executing...');

    // 执行SQL
    await pool.query(sql);

    console.log('✅ Database initialized successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - account');
    console.log('  - daily_work_data');
    console.log('  - psychological_indicators');
    console.log('  - psychological_tests');
    console.log('  - trading_strategies');
    console.log('  - risk_models');
    console.log('  - risk_config');
    console.log('  - account_risk_data');
    console.log('  - technical_indicators');
    console.log('  - orders');
    console.log('  - transactions');
    console.log('  - trade_records');
    console.log('  - stock_pool');
    console.log('  - stock_kline_data');
    console.log('  - strategy_records');

    console.log('\n💾 Default data inserted:');
    console.log('  - Account balance: 100,000');
    console.log('  - Risk config: 6% total, 2% single');
    console.log('  - 5 psychological indicators');
    console.log('  - 4 trading strategies (2 buy, 2 sell)');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed.');
  }
}

initDatabase();
