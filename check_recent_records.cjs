const { pool } = require('./backend/src/config/database');

(async () => {
  const c = await pool.connect();
  try {
    // 检查最近创建的记录
    const r = await c.query("SELECT * FROM trade_records ORDER BY id DESC LIMIT 5");
    console.log('最近5条 trade_records:');
    console.log(JSON.stringify(r.rows, null, 2));
  } finally {
    c.release();
    process.exit();
  }
})();