const { pool } = require('./src/config/database');

async function clean() {
  const result = await pool.query("DELETE FROM daily_work_data WHERE date::text LIKE '2026-03-31%'");
  console.log('删除了', result.rowCount, '条记录');
  await pool.end();
}

clean();
