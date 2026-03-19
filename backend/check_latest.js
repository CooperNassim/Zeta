const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query('SELECT id, test_date, overall_score, scores FROM psychological_test_results ORDER BY id DESC LIMIT 3');
  console.log('数据库最新3条记录:');
  result.rows.forEach(r => {
    console.log(`ID: ${r.id}, test_date: ${r.test_date.toISOString()}, score: ${r.overall_score}, scores:`, r.scores);
  });
  await pool.end();
})();
