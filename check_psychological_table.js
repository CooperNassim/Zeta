import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zeta_trading',
  password: '960717',
  port: 5432,
});

(async () => {
  try {
    // 查询 psychological_tests 表结构
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'psychological_tests'
      ORDER BY ordinal_position;
    `);

    console.log('psychological_tests 表结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // 查询测试数据
    const testData = await pool.query('SELECT * FROM psychological_tests LIMIT 5');
    console.log('\npsychological_tests 示例数据:');
    console.log(JSON.stringify(testData.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('查询失败:', error);
    await pool.end();
    process.exit(1);
  }
})();
