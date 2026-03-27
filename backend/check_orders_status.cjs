const { pool } = require('./src/config/database');

(async () => {
  try {
    // 检查订单状态分布
    const result = await pool.query(`
      SELECT 
        deleted,
        order_type,
        COUNT(*) as count
      FROM trade_orders
      GROUP BY deleted, order_type
      ORDER BY deleted, order_type
    `);
    
    console.log('=== 订单状态分布 ===\n');
    console.table(result.rows);
    
    // 检查未删除的订单
    const activeOrders = await pool.query(`
      SELECT id, trade_number, order_type, symbol, deleted
      FROM trade_orders
      WHERE deleted = false
      ORDER BY id DESC
      LIMIT 20
    `);
    
    console.log('\n=== 未删除的订单 (前20条) ===\n');
    if (activeOrders.rows.length === 0) {
      console.log('没有未删除的订单');
    } else {
      console.table(activeOrders.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
