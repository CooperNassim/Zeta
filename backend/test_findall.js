const { pool } = require('./src/config/database');

async function testFindAll() {
  try {
    const tables = ['risk_config', 'account', 'daily_work_data'];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        console.log(`${table}: ${result.rows.length} 条记录`);
      } catch (err) {
        console.error(`${table} 查询失败:`, err.message);
      }
    }

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    pool.end();
  }
}

testFindAll();
