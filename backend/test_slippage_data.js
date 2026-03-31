const { pool } = require('./src/config/database');

(async () => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT id, stock_name, buy_order_price, buy_price, buy_quantity FROM trade_records WHERE buy_order_price IS NOT NULL LIMIT 3"
    );
    console.log('Trade records data:');
    result.rows.forEach(r => {
      console.log(JSON.stringify(r));
    });
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
