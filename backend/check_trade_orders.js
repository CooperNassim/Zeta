const { pool } = require('./src/config/database');

(async () => {
  try {
    const countResult = await pool.query('SELECT COUNT(*) as count FROM trade_orders');
    console.log('总记录数:', countResult.rows[0].count);

    const dataResult = await pool.query('SELECT * FROM trade_orders');
    console.log('所有记录:', dataResult.rows);
  } catch (e) {
    console.error('错误:', e.message);
  } finally {
    await pool.end();
  }
})();
