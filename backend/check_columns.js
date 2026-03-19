const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('psychological_test_results', 'daily_work_data') ORDER BY table_name, ordinal_position");
  result.rows.forEach(r => console.log(r.table_name, r.column_name, r.data_type));
  await pool.end();
})();
