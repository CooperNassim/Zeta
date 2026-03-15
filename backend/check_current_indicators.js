const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      `SELECT id, indicator_id, name FROM psychological_indicators WHERE deleted = false ORDER BY sort_order`
    );
    console.log('当前 psychological_indicators 数据:');
    result.rows.forEach(row => {
      console.log(`  id: ${row.id}, indicator_id: ${row.indicator_id}, name: ${row.name}`);
    });
    await pool.end();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
