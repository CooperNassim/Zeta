const { pool } = require('./src/config/database');

(async () => {
  try {
    await pool.query('DELETE FROM daily_work_data WHERE date = $1', ['2026-03-12']);
    await pool.query('INSERT INTO daily_work_data (date, nasdaq) VALUES ($1, $2)', ['2026-03-12', '测试数据']);
    console.log('测试数据创建成功');
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
})();
