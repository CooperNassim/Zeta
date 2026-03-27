const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'trade_orders'
    ORDER BY ordinal_position
  `);
  console.log(JSON.stringify(result.rows.map(r => r.column_name), null, 2));
  await pool.end();
})();
