const { pool } = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query("SELECT test_date::text as test_date_text, test_date, scores, overall_score FROM psychological_test_results WHERE deleted = false ORDER BY test_date DESC LIMIT 1");
    console.log('原始数据:', JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
