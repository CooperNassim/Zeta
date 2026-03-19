const { pool } = require('./src/config/database');

async function checkAll() {
  try {
    const result = await pool.query('SELECT id, test_date, scores, overall_score, deleted FROM psychological_test_results ORDER BY id');
    console.log('所有记录（包括已删除）:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, 日期: ${row.test_date}, 分数: ${JSON.stringify(row.scores)}, 总分: ${row.overall_score}, 已删除: ${row.deleted}`);
    });
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkAll();
