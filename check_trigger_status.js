const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'trading_db',
  user: 'postgres',
  password: 'postgres'
});

(async () => {
  try {
    // 检查触发器是否存在
    const triggerCheck = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'trade_orders'
    `);
    console.log('\n=== 触发器状态 ===');
    console.log(JSON.stringify(triggerCheck.rows, null, 2));

    // 检查触发器函数
    const funcCheck = await pool.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname LIKE '%trade_record%'
    `);
    console.log('\n=== 触发器函数 ===');
    console.log(JSON.stringify(funcCheck.rows.map(r => r.proname), null, 2));

    // 检查最近的订单
    const ordersCheck = await pool.query(`
      SELECT id, trade_number, order_type, symbol, quantity, price, created_at, deleted 
      FROM trade_orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n=== 最近的订单 ===');
    console.log(JSON.stringify(ordersCheck.rows, null, 2));

    // 检查交易记录
    const recordsCheck = await pool.query(`
      SELECT id, trade_number, symbol, buy_quantity, buy_price, sell_quantity, sell_price, created_at 
      FROM trade_records 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n=== 交易记录 ===');
    console.log(JSON.stringify(recordsCheck.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
})();
