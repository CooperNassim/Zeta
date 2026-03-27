const { pool } = require('./backend/src/config/database');

(async () => {
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trade_records' ORDER BY ordinal_position");
    console.log('trade_records 表的字段:');
    console.log(r.rows.map(x=>x.column_name).join(', '));
    
    // 检查是否有 buy_order_price 字段
    const hasBuyOrderPrice = r.rows.some(x => x.column_name === 'buy_order_price');
    console.log('\n是否有 buy_order_price 字段:', hasBuyOrderPrice ? '是' : '否');
    
    // 检查 trade_orders 表结构
    const r2 = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trade_orders' ORDER BY ordinal_position");
    console.log('\ntrade_orders 表的字段:');
    console.log(r2.rows.map(x=>x.column_name).join(', '));
  } finally {
    c.release();
    process.exit();
  }
})();