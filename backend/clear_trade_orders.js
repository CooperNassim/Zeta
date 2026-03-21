const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM trade_orders');
    console.log('trade_orders 表已清空');
  } catch (e) {
    console.error('错误:', e.message);
  } finally {
    await client.release();
    await pool.end();
  }
})();
