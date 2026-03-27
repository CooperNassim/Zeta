const { pool } = require('./backend/src/config/database');

(async () => {
  const c = await pool.connect();
  try {
    // 检查 trade_records 中有 buy_order_price 的数据
    const r = await c.query("SELECT id, trade_number, symbol, buy_price, buy_order_price, sell_price, sell_order_price FROM trade_records WHERE trade_number = '20260327001' ORDER BY id");
    console.log('trade_records 数据 (trade_number=20260327001):');
    console.log(JSON.stringify(r.rows, null, 2));

    // 检查所有有 buy_order_price 的记录
    const r2 = await c.query("SELECT id, trade_number, symbol, buy_price, buy_order_price FROM trade_records WHERE buy_order_price IS NOT NULL LIMIT 10");
    console.log('\n有 buy_order_price 的记录:');
    console.log(JSON.stringify(r2.rows, null, 2));
  } finally {
    c.release();
    process.exit();
  }
})();