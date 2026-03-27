const { pool } = require('./backend/src/config/database');

(async () => {
  const c = await pool.connect();
  try {
    const r = await c.query("SELECT prosrc FROM pg_proc WHERE proname = 'sync_trade_order_to_records'");
    console.log('触发器函数 sync_trade_order_to_records 的代码:');
    console.log(r.rows[0]?.prosrc || '未找到');
  } finally {
    c.release();
    process.exit();
  }
})();