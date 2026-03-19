const { pool } = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query('SELECT id, name FROM trading_strategies LIMIT 3');
    console.log('数据库中的记录:');
    res.rows.forEach(r => console.log(JSON.stringify(r)));
    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
  }
})();
