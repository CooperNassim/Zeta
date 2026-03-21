const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('数据库中所有表:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
  } finally {
    await client.release();
    await pool.end();
  }
})();
