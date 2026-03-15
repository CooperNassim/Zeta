const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      `SELECT id, indicator_id, name, deleted FROM psychological_indicators ORDER BY sort_order`
    );
    console.log('数据库中的 psychological_indicators:');
    result.rows.forEach(row => {
      console.log(`  db id: ${row.id}, indicator_id: ${row.indicator_id}, name: ${row.name}, deleted: ${row.deleted}`);
    });
    await pool.end();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
