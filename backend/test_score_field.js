const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      'SELECT id, test_date, score, overall_score FROM psychological_test_results WHERE deleted = false ORDER BY test_date DESC'
    );

    console.log('=== 心理测试结果 ===');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`test_date: ${row.test_date}`);
      console.log(`score: ${JSON.stringify(row.score)}`);
      console.log(`overall_score: ${row.overall_score}`);
      console.log('---');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
})();
