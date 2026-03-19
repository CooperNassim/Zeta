const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('测试直接查询...');
    const result = await pool.query(
      "SELECT * FROM psychological_test_results WHERE test_date = $1 AND deleted = false LIMIT 1",
      ['2026-03-13']
    );
    console.log('查询成功:', result.rows);
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

test();
