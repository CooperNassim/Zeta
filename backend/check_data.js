const {pool} = require('./src/config/database');
(async()=>{
  // Check latest dates
  const r = await pool.query("SELECT MAX(trade_date) as latest_date FROM stock_daily");
  console.log('Latest trade_date in stock_daily:', r.rows[0].latest_date);
  
  // Count by date
  const r2 = await pool.query("SELECT trade_date, COUNT(*) as cnt FROM stock_daily GROUP BY trade_date ORDER BY trade_date DESC LIMIT 10");
  console.log('\nRecords by date:');
  r2.rows.forEach(row => console.log(`  ${row.trade_date}: ${row.cnt} records`));
  
  // Total
  const r3 = await pool.query("SELECT COUNT(*) as total FROM stock_daily");
  console.log('Total records:', r3.rows[0].total);
  
  await pool.end();
})();
