const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      `SELECT id, test_date, scores, overall_score, notes FROM psychological_test_results WHERE deleted = false ORDER BY test_date DESC LIMIT 5`
    );
    console.log('数据库中的心理测试结果:');
    result.rows.forEach(row => {
      console.log(`  id: ${row.id}, date: ${row.test_date}, overall_score: ${row.overall_score}, scores:`, row.scores);
    });
    await pool.end();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
