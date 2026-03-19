const { pool } = require('./src/config/database');

(async () => {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trading_strategies' ORDER BY ordinal_position");
  console.log(res.rows);
  await pool.end();
})()
