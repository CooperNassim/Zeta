const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query('SELECT id, test_date, overall_score, scores FROM psychological_test_results ORDER BY id DESC LIMIT 5');
  console.log('数据库最新5条:');
  result.rows.forEach(r => console.log('ID:', r.id, '日期:', r.test_date, '分数:', r.overall_score));
  await pool.end();
})();
