const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query('SELECT id, test_date, overall_score FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 1');
  console.log('数据库原始:', JSON.stringify(result.rows[0]));
  console.log('数据库test_date类型:', typeof result.rows[0].test_date);
  console.log('数据库test_date值:', result.rows[0].test_date);
  await pool.end();
})();
