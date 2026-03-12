const { pool } = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'psychological_test_results' AND column_name = 'test_date'");
    console.log('test_date字段类型:', res.rows);
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
