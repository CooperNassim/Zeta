const { pool } = require('./src/config/database');

(async () => {
  try {
    // 查找所有备份表
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE '%trade%'
    `);
    console.log('=== 所有 trade 相关表 ===');
    console.log(JSON.stringify(tables.rows, null, 2));

    // 检查 trade_orders 表数据量
    const ordersCount = await pool.query('SELECT COUNT(*) FROM trade_orders');
    console.log('\n=== trade_orders 记录数 ===');
    console.log(JSON.stringify(ordersCount.rows, null, 2));

    // 检查最近的 trade_orders
    const recentOrders = await pool.query(`
      SELECT id, trade_number, order_type, symbol, name, price, quantity, status, created_at
      FROM trade_orders
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('\n=== 最近5条 trade_orders ===');
    console.log(JSON.stringify(recentOrders.rows, null, 2));

    // 检查每个表的记录数
    for (const row of tables.rows) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`\n${row.table_name}: ${countResult.rows[0].count} 条记录`);
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
})();
