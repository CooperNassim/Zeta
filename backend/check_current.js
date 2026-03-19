const { pool } = require('./src/config/database');

async function check() {
  try {
    const result = await pool.query('SELECT * FROM psychological_test_results WHERE deleted = false ORDER BY id DESC LIMIT 1');
    console.log('最近记录:', JSON.stringify(result.rows[0], null, 2));
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

check();
