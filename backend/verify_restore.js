const { pool } = require('./src/config/database');

(async () => {
  const result = await pool.query('SELECT COUNT(*) FROM trade_records');
  console.log(`trade_records 记录数: ${result.rows[0].count}`);

  const records = await pool.query(`
    SELECT id, trade_number, trade_type, symbol, name, buy_price, sell_price, profit, created_at
    FROM trade_records
    ORDER BY created_at DESC
  `);
  console.log('\n交易记录:');
  console.log(JSON.stringify(records.rows, null, 2));

  await pool.end();
})();
