require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/database');

(async () => {
  try {
    const result = await pool.query('SELECT id, test_date, overall_score FROM psychological_test_results ORDER BY test_date DESC');
    console.log('当前数据库记录:');
    if (result.rows.length === 0) {
      console.log('  (空)');
    } else {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}, test_date: ${row.test_date}, overall_score: ${row.overall_score}`);
      });
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
})();
