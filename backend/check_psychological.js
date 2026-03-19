const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query('SELECT id, test_date, overall_score, scores, deleted FROM psychological_test_results ORDER BY id DESC LIMIT 5');
    console.log('数据库记录:');
    result.rows.forEach(r => {
      console.log('ID:', r.id, '日期:', r.test_date, '总分:', r.overall_score, '已删除:', r.deleted);
    });
    await pool.end();
  } catch(e) {
    console.error(e);
    await pool.end();
  }
})();
