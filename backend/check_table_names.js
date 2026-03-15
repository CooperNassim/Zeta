const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%psychological%' ORDER BY table_name`
    );
    console.log('psychological 相关的表:');
    result.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    await pool.end();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
