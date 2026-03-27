const { pool } = require('./src/config/database.js');
async function check() {
  const r = await pool.query("SELECT id, trade_number, symbol, name, price, quantity, order_type FROM trade_orders WHERE price = '2' ORDER BY id DESC LIMIT 10");
  console.log('trade_orders with price = 2:');
  console.log(JSON.stringify(r.rows, null, 2));
}
check().then(() => process.exit());