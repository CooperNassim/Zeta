const { pool } = require('./src/config/database');

(async () => {
  try {
    // 查询 psychological_test_results 表结构
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'psychological_test_results'
      ORDER BY ordinal_position;
    `);

    console.log('psychological_test_results 表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // 查询所有数据
    const data = await pool.query('SELECT * FROM psychological_test_results WHERE deleted = false LIMIT 1');
    console.log('\n第一条记录的完整数据:');
    console.log(JSON.stringify(data.rows[0], null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
})();
