const { Pool } = require('pg');

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

async function runMigration() {
  const pool = new Pool(config);

  try {
    console.log('🚀 开始执行交易策略表重构迁移...');

    // 读取迁移SQL文件
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/migration_trading_strategy_refactor.sql'),
      'utf8'
    );

    // 执行迁移
    await pool.query(migrationSQL);

    console.log('✅ 交易策略表重构完成!');
    console.log('');
    console.log('📊 新表结构:');
    console.log('  - trading_strategies (交易策略表)');
    console.log('');
    console.log('📝 主要字段:');
    console.log('  - id: 策略ID');
    console.log('  - strategy_type: 策略类型 (买入/卖出)');
    console.log('  - name: 策略名称');
    console.log('  - eval_standard_1~5: 评估标准Ⅰ~Ⅴ (TEXT类型)');
    console.log('  - status: 状态 (启用/停用)');
    console.log('  - deleted: 软删除标记');
    console.log('  - created_at/updated_at: 时间戳');
    console.log('');
    console.log('🔍 已插入6条示例数据');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
