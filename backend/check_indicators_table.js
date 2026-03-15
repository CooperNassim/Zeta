const { pool } = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'psychological_indicators'
       ORDER BY ordinal_position`
    );
    console.log('psychological_indicators 表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    await pool.end();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();
