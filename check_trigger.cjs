const { pool } = require('./backend/src/config/database');

async function checkTrigger() {
  try {
    // 检查触发器
    const triggerResult = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'trade_orders'
    `);
    console.log('=== trade_orders 表的触发器 ===');
    console.log(JSON.stringify(triggerResult.rows, null, 2));
    
    // 检查触发器函数
    const funcResult = await pool.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname LIKE '%trade_record%' OR proname LIKE '%sync%'
    `);
    console.log('\n=== 相关函数 ===');
    console.log(JSON.stringify(funcResult.rows, null, 2));
    
    // 检查最近的 trade_orders
    const ordersResult = await pool.query(`
      SELECT id, trade_number, order_type, status, created_at 
      FROM trade_orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n=== 最近的 trade_orders ===');
    console.log(JSON.stringify(ordersResult.rows, null, 2));
    
    // 检查最近的 trade_records
    const recordsResult = await pool.query(`
      SELECT id, trade_number, symbol, buy_price, sell_price, created_at 
      FROM trade_records 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n=== 最近的 trade_records ===');
    console.log(JSON.stringify(recordsResult.rows, null, 2));
    
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

checkTrigger();
