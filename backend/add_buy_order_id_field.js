const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('添加 buy_order_id 字段到 trade_orders 表');
    console.log('========================================\n');

    // 1. 检查字段是否已存在
    console.log('1. 检查字段是否已存在...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'trade_orders' AND column_name = 'buy_order_id';
    `);

    if (checkResult.rows.length > 0) {
      console.log('   ℹ️  buy_order_id 字段已存在,跳过添加\n');
    } else {
      // 2. 添加字段
      console.log('2. 添加 buy_order_id 字段...');
      await client.query(`
        ALTER TABLE trade_orders
        ADD COLUMN buy_order_id INTEGER;
      `);
      console.log('   ✅ buy_order_id 字段已添加\n');

      // 3. 添加索引
      console.log('3. 添加索引...');
      await client.query(`
        CREATE INDEX idx_trade_orders_buy_order_id ON trade_orders(buy_order_id);
      `);
      console.log('   ✅ 索引已添加\n');
    }

    // 4. 验证表结构
    console.log('4. 验证表结构...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_orders'
      ORDER BY ordinal_position;
    `);

    console.log('   trade_orders 表结构:');
    console.table(columns.rows);

    // 检查 buy_order_id 是否在列表中
    const hasBuyOrderId = columns.rows.some(col => col.column_name === 'buy_order_id');
    console.log(`\n   ✅ buy_order_id 字段${hasBuyOrderId ? '已存在' : '不存在'}\n`);

    console.log('========================================');
    console.log('完成!');
    console.log('========================================');
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
})();
