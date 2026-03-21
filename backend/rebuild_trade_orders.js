const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('开始重构 trade_orders 表');
    console.log('========================================\n');

    // 1. 备份现有数据
    console.log('1. 备份现有数据...');
    await client.query('DROP TABLE IF EXISTS trade_orders_backup CASCADE');
    await client.query('CREATE TABLE trade_orders_backup AS SELECT * FROM trade_orders');
    const backupCount = await client.query('SELECT COUNT(*) FROM trade_orders_backup');
    console.log(`   ✅ 已备份 ${backupCount.rows[0].count} 条记录\n`);

    // 2. 删除旧表
    console.log('2. 删除旧表...');
    await client.query('DROP TABLE IF EXISTS trade_orders CASCADE');
    console.log('   ✅ 旧表已删除\n');

    // 3. 创建新表 - 按照 daily_work_data 的规范
    console.log('3. 创建新表...');
    const createSQL = `
      CREATE TABLE trade_orders (
        id SERIAL PRIMARY KEY,
        trade_number VARCHAR(50) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        name VARCHAR(100),
        price NUMERIC NOT NULL,
        quantity INTEGER NOT NULL,
        stop_loss_price NUMERIC,
        take_profit_price NUMERIC,
        psychological_score NUMERIC,
        strategy_score NUMERIC,
        risk_score NUMERIC,
        overall_score NUMERIC,
        order_date DATE NOT NULL,
        order_time VARCHAR(8),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        is_virtual BOOLEAN NOT NULL DEFAULT false,
        notes TEXT,
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createSQL);
    console.log('   ✅ 新表已创建\n');

    // 4. 创建索引
    console.log('4. 创建索引...');
    await client.query('CREATE INDEX idx_trade_orders_symbol ON trade_orders(symbol)');
    await client.query('CREATE INDEX idx_trade_orders_status ON trade_orders(status)');
    await client.query('CREATE INDEX idx_trade_orders_date ON trade_orders(order_date DESC)');
    await client.query('CREATE INDEX idx_trade_orders_deleted ON trade_orders(deleted)');
    console.log('   ✅ 索引已创建\n');

    // 5. 恢复数据
    console.log('5. 恢复数据...');
    const insertSQL = `
      INSERT INTO trade_orders (
        id, trade_number, order_type, symbol, name, price, quantity,
        stop_loss_price, take_profit_price, psychological_score,
        strategy_score, risk_score, overall_score, order_date, order_time,
        status, is_virtual, notes, deleted, deleted_at, created_at, updated_at
      )
      SELECT
        id, trade_number, order_type, symbol, name, price, quantity,
        stop_loss_price, take_profit_price, psychological_score,
        strategy_score, risk_score, overall_score, order_date, order_time,
        status, is_virtual, notes, deleted, deleted_at, created_at, updated_at
      FROM trade_orders_backup;
    `;
    const result = await client.query(insertSQL);
    console.log(`   ✅ 已恢复 ${result.rowCount} 条记录\n`);

    // 6. 重置序列
    console.log('6. 重置序列...');
    const maxId = await client.query('SELECT MAX(id) as max_id FROM trade_orders');
    const nextVal = (maxId.rows[0].max_id || 0) + 1;
    await client.query(`SELECT setval('trade_orders_id_seq', ${nextVal}, false)`);
    console.log(`   ✅ 序列已重置，下一个值: ${nextVal}\n`);

    // 7. 验证表结构
    console.log('7. 验证表结构...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_orders'
      ORDER BY ordinal_position;
    `);
    console.log('   新表结构:');
    console.table(columns.rows);

    console.log('\n========================================');
    console.log('重构完成！');
    console.log('========================================');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
})();
