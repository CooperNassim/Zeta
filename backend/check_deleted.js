const { pool } = require('./src/config/database');

async function check() {
  try {
    const result = await pool.query(
      "SELECT * FROM psychological_test_results WHERE test_date = $1",
      ['2026-03-13']
    );
    console.log('所有记录（包括已删除）:', result.rows);
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

check();
