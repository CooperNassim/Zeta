const { pool } = require('./src/config/database.js');
async function check() {
  const r = await pool.query("SELECT id, trade_number, symbol, buy_order_price FROM trade_records WHERE buy_order_price IS NOT NULL ORDER BY id DESC LIMIT 10");
  console.log('trade_records with buy_order_price:');
  console.log(JSON.stringify(r.rows, null, 2));
}
check().then(() => process.exit());