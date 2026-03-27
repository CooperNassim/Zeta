const { pool } = require('./src/config/database.js');
async function check() {
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trade_orders' ORDER BY ordinal_position");
  console.log('trade_orders columns:', r.rows.map(x => x.column_name).join(', '));
}
check().then(() => process.exit());