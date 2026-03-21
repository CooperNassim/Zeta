const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;");
    console.log('当前 orders 表结构:');
    console.table(result.rows);
  } finally {
    await client.release();
    await pool.end();
  }
})();
